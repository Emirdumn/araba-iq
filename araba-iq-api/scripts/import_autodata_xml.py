"""
import_autodata_xml.py
─────────────────────────────────────────────────────────────
auto-data.net XML formatını parse edip ArabaIQ veritabanına
aktar. Mevcut kayıtlara zarar vermez (upsert / skip).

XML yapısı:
  brands → brand → models → model → generations →
  generation → modifications → modification

Eşleştirme:
  brand        → Brand
  model        → VehicleModel  (tüm generation'lar tek model)
  modification → CarVariant    (yıl = yearstart)
  abs / drive / valvetrain → CarFeature

Kullanım:
  # Doğrudan:
  PYTHONPATH=. python scripts/import_autodata_xml.py /path/to/data.xml

  # Docker içinden (volume sayesinde /app altında görünür):
  docker exec pls-araba-iq-api-1 \
      python scripts/import_autodata_xml.py /app/scripts/data.xml
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Optional
import xml.etree.ElementTree as ET

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.brand import Brand
from app.models.car_feature import CarFeature
from app.models.car_variant import CarVariant
from app.models.segment import Segment
from app.models.vehicle_model import VehicleModel


# ─── XML namespace ───────────────────────────────────────────────
NS = "http://www.auto-data.net/"


def t(name: str) -> str:
    """Return fully-qualified tag name for the auto-data namespace."""
    return f"{{{NS}}}{name}"


# ─── Encoding fix ────────────────────────────────────────────────
def fix(s: Optional[str]) -> str:
    """
    Garbled Turkish chars are produced when UTF-8 bytes are
    misinterpreted as Latin-1 and then re-encoded.
    Reverse the process: encode as Latin-1 → decode as UTF-8.
    Falls back to original if conversion fails.
    """
    if not s:
        return ""
    try:
        return s.encode("latin-1").decode("utf-8")
    except (UnicodeDecodeError, UnicodeEncodeError):
        return s


def txt(el: Optional[ET.Element]) -> Optional[str]:
    """Return cleaned + encoding-fixed text of an element, or None."""
    if el is None:
        return None
    val = (el.text or "").strip()
    if not val:
        return None
    return fix(val)


def num(el: Optional[ET.Element], cast=int) -> Optional:
    """Parse numeric text from element; return None on failure."""
    v = txt(el)
    if v is None:
        return None
    try:
        return cast(v)
    except (ValueError, TypeError):
        return None


def fnum(el: Optional[ET.Element]) -> Optional[float]:
    return num(el, cast=float)


# ─── Coupe → body_type / segment name ────────────────────────────
def coupe_to_body(raw: str) -> str:
    c = raw.lower()
    if "pick-up" in c:
        return "Pick-up"
    if "suv" in c or "off-road" in c:
        return "SUV"
    if "cabriolet" in c or "cabrio" in c:
        return "Cabriolet"
    if "hatchback" in c:
        return "Hatchback"
    if "sedan" in c:
        return "Sedan"
    if "station" in c or "kombi" in c:
        return "Station Wagon"
    if "mpv" in c or "minivan" in c:
        return "MPV"
    if "coupe" in c or "coupé" in c:
        return "Coupe"
    return fix(raw)


def body_to_segment(body: str) -> str:
    """Map body type to a broad segment name."""
    mapping = {
        "Pick-up":       "Pick-up",
        "SUV":           "SUV",
        "Cabriolet":     "Cabriolet",
        "Hatchback":     "Hatchback",
        "Sedan":         "Sedan",
        "Station Wagon": "Station Wagon",
        "MPV":           "MPV",
        "Coupe":         "Coupe",
    }
    return mapping.get(body, "Diğer")


# ─── Transmission ────────────────────────────────────────────────
def parse_transmission(mod: ET.Element) -> Optional[str]:
    mt = mod.find(t("gearboxMT"))
    at = mod.find(t("gearboxAT"))
    if mt is not None and mt.text and mt.text.strip():
        return "Manuel"
    if at is not None and at.text and at.text.strip():
        return "Otomatik"
    return None


# ─── DB helpers (get-or-create) ──────────────────────────────────
def get_or_create_segment(db: Session, name: str) -> Segment:
    seg = db.query(Segment).filter_by(name=name).first()
    if not seg:
        seg = Segment(name=name, category_type="technical")
        db.add(seg)
        db.flush()
        print(f"  [+] Segment: {name}")
    return seg


def get_or_create_brand(db: Session, name: str) -> Brand:
    brand = db.query(Brand).filter_by(name=name).first()
    if not brand:
        brand = Brand(name=name, is_active=True)
        db.add(brand)
        db.flush()
        print(f"  [+] Brand: {name}")
    return brand


def get_or_create_model(
    db: Session,
    brand_id: int,
    name: str,
    segment_id: int,
    body_type: str,
    start_year: Optional[int],
    end_year: Optional[int],
) -> VehicleModel:
    model = (
        db.query(VehicleModel)
        .filter_by(brand_id=brand_id, name=name)
        .first()
    )
    if not model:
        model = VehicleModel(
            brand_id=brand_id,
            segment_id=segment_id,
            name=name,
            body_type=body_type,
            start_year=start_year,
            end_year=end_year,
        )
        db.add(model)
        db.flush()
        print(f"    [+] Model: {name}")
    return model


# ─── Build CarFeatures from a modification ───────────────────────
def build_features(mod: ET.Element, variant_id: int) -> list[CarFeature]:
    features: list[CarFeature] = []

    def feat(category: str, name: str, value: str = "true") -> CarFeature:
        return CarFeature(
            car_variant_id=variant_id,
            feature_category=category,
            feature_name=name,
            feature_value=value,
        )

    # ABS
    abs_el = mod.find(t("abs"))
    if abs_el is not None and abs_el.text == "1":
        features.append(feat("safety", "ABS"))

    # Power steering
    ps = txt(mod.find(t("powerSteering")))
    if ps:
        features.append(feat("steering", "Direksiyon", ps))

    # Valvetrain
    vt = txt(mod.find(t("valvetrain")))
    if vt:
        features.append(feat("engine", "Supap Sistemi", fix(vt)))

    # Drivetrain
    drv = txt(mod.find(t("drive")))
    if drv:
        features.append(feat("drivetrain", "Çekiş", fix(drv)))

    # Engine position
    ep = txt(mod.find(t("engineposition")))
    if ep:
        features.append(feat("engine", "Motor Konumu", fix(ep)))

    # Cylinder layout
    cl = txt(mod.find(t("positioncilinders")))
    if cl:
        features.append(feat("engine", "Silindir Dizilimi", fix(cl)))

    # Turbine / aspiration
    turb = txt(mod.find(t("turbine")))
    if turb and "atmosferik" not in turb.lower():
        features.append(feat("engine", "Turbo", fix(turb)))

    return features


# ─── Main import logic ───────────────────────────────────────────
def import_xml(xml_path: Path) -> None:
    print(f"\nParsing: {xml_path}")
    tree = ET.parse(xml_path)
    root = tree.getroot()

    db = SessionLocal()
    try:
        brands_el = root.findall(t("brand"))
        total_variants = 0
        skipped_variants = 0

        for brand_el in brands_el:
            brand_name = txt(brand_el.find(t("name"))) or ""
            if not brand_name:
                continue

            brand_obj = get_or_create_brand(db, brand_name)

            for model_el in brand_el.findall(f".//{t('model')}"):
                model_name = txt(model_el.find(t("name"))) or ""
                if not model_name:
                    continue

                # Collect all modifications under this model to derive
                # body type, segment, and year range before creating the model
                all_mods = model_el.findall(f".//{t('modification')}")
                if not all_mods:
                    continue

                # Determine body type from first modification that has it
                body_type = "Diğer"
                for m in all_mods:
                    coupe_el = m.find(t("coupe"))
                    if coupe_el is not None and coupe_el.text:
                        body_type = coupe_to_body(coupe_el.text.strip())
                        break

                segment_name = body_to_segment(body_type)
                segment_obj = get_or_create_segment(db, segment_name)

                # Year range across all modifications
                years = [
                    n for n in (
                        num(m.find(t("yearstart"))) for m in all_mods
                    ) if n is not None
                ]
                end_years = [
                    n for n in (
                        num(m.find(t("yearstop"))) for m in all_mods
                    ) if n is not None
                ]
                start_year = min(years) if years else None
                end_year   = max(end_years) if end_years else None

                model_obj = get_or_create_model(
                    db,
                    brand_id=brand_obj.id,
                    name=model_name,
                    segment_id=segment_obj.id,
                    body_type=body_type,
                    start_year=start_year,
                    end_year=end_year,
                )

                for mod in all_mods:
                    engine_name = txt(mod.find(t("engine"))) or "—"
                    year_start  = num(mod.find(t("yearstart")))
                    if year_start is None:
                        continue  # year is required for CarVariant

                    # Skip exact duplicate (same trim_name + year + model)
                    exists = (
                        db.query(CarVariant)
                        .filter_by(
                            model_id=model_obj.id,
                            trim_name=engine_name,
                            year=year_start,
                        )
                        .first()
                    )
                    if exists:
                        skipped_variants += 1
                        continue

                    fuel_raw = txt(mod.find(t("fuel"))) or ""
                    fuel_type = fix(fuel_raw)

                    # Fuel normalisation → match ArabaIQ convention
                    fuel_lower = fuel_type.lower()
                    if "benzin" in fuel_lower:
                        fuel_type = "Benzin"
                    elif "dizel" in fuel_lower:
                        fuel_type = "Dizel"
                    elif "elektrik" in fuel_lower:
                        fuel_type = "Elektrik"
                    elif "hibrit" in fuel_lower or "hybrid" in fuel_lower:
                        fuel_type = "Hibrit"
                    else:
                        fuel_type = fuel_type or None  # type: ignore[assignment]

                    transmission = parse_transmission(mod)

                    # torqueNm field: might be a compound "174/4500" or just "174"
                    torque_nm: Optional[int] = None
                    torque_el = mod.find(t("torqueNm"))
                    if torque_el is not None and torque_el.text:
                        try:
                            torque_nm = int(torque_el.text.split("/")[0].strip())
                        except ValueError:
                            pass

                    cv = CarVariant(
                        model_id=model_obj.id,
                        trim_name=engine_name,
                        year=year_start,
                        fuel_type=fuel_type,
                        transmission=transmission,
                        engine_cc=num(mod.find(t("engineDisplacement"))),
                        horsepower=num(mod.find(t("powerHp"))),
                        torque_nm=torque_nm,
                        drivetrain=fix(txt(mod.find(t("drive"))) or ""),
                        combined_fuel_consumption=fnum(mod.find(t("fuelConsumptionCombined"))),
                        zero_to_hundred=fnum(mod.find(t("acceleration"))),
                        top_speed=num(mod.find(t("maxspeed"))),
                        seat_count=num(mod.find(t("places"))),
                        luggage_capacity=num(mod.find(t("luggageMin"))),
                        weight_kg=num(mod.find(t("curbWeight"))),
                    )
                    db.add(cv)
                    db.flush()  # get cv.id for features

                    # CarFeature entries
                    for feat in build_features(mod, cv.id):
                        db.add(feat)

                    total_variants += 1
                    print(
                        f"      [+] Variant: {brand_name} {model_name} "
                        f"'{engine_name}' ({year_start})"
                    )

        db.commit()
        print(
            f"\n✓ Import complete — "
            f"{total_variants} variants inserted, "
            f"{skipped_variants} skipped (already exist)."
        )

    except Exception as exc:
        db.rollback()
        print(f"\n✗ Import failed: {exc}")
        raise
    finally:
        db.close()


# ─── CLI entry point ─────────────────────────────────────────────
if __name__ == "__main__":
    if len(sys.argv) < 2:
        default = Path(__file__).parent.parent / "data.xml"
        xml_file = default
    else:
        xml_file = Path(sys.argv[1])

    if not xml_file.exists():
        print(f"Error: file not found → {xml_file}")
        print("Usage: python scripts/import_autodata_xml.py /path/to/data.xml")
        sys.exit(1)

    import_xml(xml_file)

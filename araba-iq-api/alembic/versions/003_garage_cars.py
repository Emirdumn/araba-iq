"""garage_cars table for user-added vehicles

Revision ID: 003
Revises: 002
Create Date: 2026-03-28

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "garage_cars",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("brand", sa.String(length=128), nullable=False),
        sa.Column("model", sa.String(length=128), nullable=False),
        sa.Column("variant", sa.String(length=256), nullable=True),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("price", sa.Integer(), nullable=True),
        sa.Column("mileage_km", sa.Integer(), nullable=True),
        sa.Column("listing_url", sa.Text(), nullable=True),
        sa.Column("fuel_type", sa.String(length=32), nullable=True),
        sa.Column("transmission", sa.String(length=32), nullable=True),
        sa.Column("body_type", sa.String(length=64), nullable=True),
        sa.Column("segment", sa.String(length=32), nullable=True),
        sa.Column("horsepower", sa.Integer(), nullable=True),
        sa.Column("engine_cc", sa.Integer(), nullable=True),
        sa.Column("combined_fuel_consumption", sa.Numeric(5, 2), nullable=True),
        sa.Column("luggage_capacity", sa.Integer(), nullable=True),
        sa.Column("equipment", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("is_favorite", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_garage_cars_brand"), "garage_cars", ["brand"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_garage_cars_brand"), table_name="garage_cars")
    op.drop_table("garage_cars")

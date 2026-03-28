"""price_history table for weekly price snapshots

Revision ID: 004
Revises: 003
Create Date: 2026-03-28

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "price_history",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("car_variant_id", sa.Integer(), nullable=False),
        sa.Column("snapshot_date", sa.Date(), nullable=False),
        sa.Column("source", sa.String(length=64), nullable=False, server_default="sahibinden"),
        sa.Column("sample_size", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("avg_price", sa.Numeric(14, 2), nullable=True),
        sa.Column("min_price", sa.Integer(), nullable=True),
        sa.Column("max_price", sa.Integer(), nullable=True),
        sa.Column("median_price", sa.Numeric(14, 2), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["car_variant_id"], ["car_variants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_price_history_car_variant_id"), "price_history", ["car_variant_id"], unique=False)
    op.create_index(op.f("ix_price_history_snapshot_date"), "price_history", ["snapshot_date"], unique=False)
    op.create_index(
        "ix_price_history_variant_date",
        "price_history",
        ["car_variant_id", "snapshot_date"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_price_history_variant_date", table_name="price_history")
    op.drop_index(op.f("ix_price_history_snapshot_date"), table_name="price_history")
    op.drop_index(op.f("ix_price_history_car_variant_id"), table_name="price_history")
    op.drop_table("price_history")

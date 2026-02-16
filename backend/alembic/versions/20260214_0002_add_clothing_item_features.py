"""add clothing item features table

Revision ID: 20260214_0002
Revises: 20260213_0001
Create Date: 2026-02-14 00:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260214_0002"
down_revision: Union[str, None] = "20260213_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "clothing_item_features",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("item_id", sa.Integer(), nullable=False),
        sa.Column("item_type", sa.String(length=20), nullable=False),
        sa.Column("color", sa.String(length=20), nullable=True),
        sa.Column("style", sa.String(length=20), nullable=True),
        sa.Column("season", sa.String(length=20), nullable=True),
        sa.Column("fit", sa.String(length=20), nullable=True),
        sa.Column("formality", sa.Integer(), nullable=True),
        sa.Column("warmth", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["item_id"], ["clothing_items.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("item_id"),
    )
    op.create_index(op.f("ix_clothing_item_features_item_id"), "clothing_item_features", ["item_id"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_clothing_item_features_item_id"), table_name="clothing_item_features")
    op.drop_table("clothing_item_features")

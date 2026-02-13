"""initial schema

Revision ID: 20260213_0001
Revises:
Create Date: 2026-02-13 00:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260213_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "clothing_items",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=True),
        sa.Column("image_path", sa.String(length=500), nullable=True),
        sa.Column("stock_info", sa.String(length=200), nullable=True),
        sa.Column("location", sa.String(length=100), nullable=True),
        sa.Column("gender", sa.String(length=10), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "generated_images",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("task_id", sa.String(length=64), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("provider", sa.String(length=20), nullable=False),
        sa.Column("image_path", sa.String(length=500), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("gender", sa.String(length=10), nullable=True),
        sa.Column("tpo", sa.String(length=20), nullable=True),
        sa.Column("height", sa.Float(), nullable=True),
        sa.Column("fit", sa.String(length=20), nullable=True),
        sa.Column("category", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_generated_images_task_id"), "generated_images", ["task_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_generated_images_task_id"), table_name="generated_images")
    op.drop_table("generated_images")
    op.drop_table("clothing_items")

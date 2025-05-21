"""add model versioning

Revision ID: 002
Revises: 001
Create Date: 2024-03-20 10:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade():
    # Create model_versions table
    op.create_table(
        "model_versions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("version", sa.String(), nullable=False),
        sa.Column("changelog", sa.Text(), nullable=False),
        sa.Column("s3_path", sa.String(), nullable=False),
        sa.Column("size_mb", sa.Float(), nullable=False),
        sa.Column("format", sa.String(), nullable=False),
        sa.Column("model_metadata", sa.JSON(), nullable=True),
        sa.Column("performance_metrics", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("model_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["model_id"], ["models.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_model_versions_version"), "model_versions", ["version"], unique=False
    )

    # Modify models table
    # 1. Add current_version column
    op.add_column("models", sa.Column("current_version", sa.String(), nullable=True))

    # 2. Remove columns that are now in model_versions
    op.drop_column("models", "version")
    op.drop_column("models", "format")
    op.drop_column("models", "s3_path")
    op.drop_column("models", "size_mb")
    op.drop_column("models", "model_metadata")
    op.drop_column("models", "performance_metrics")


def downgrade():
    # Add back columns to models table
    op.add_column("models", sa.Column("version", sa.String(), nullable=True))
    op.add_column("models", sa.Column("format", sa.String(), nullable=True))
    op.add_column("models", sa.Column("s3_path", sa.String(), nullable=True))
    op.add_column("models", sa.Column("size_mb", sa.Float(), nullable=True))
    op.add_column("models", sa.Column("model_metadata", sa.JSON(), nullable=True))
    op.add_column("models", sa.Column("performance_metrics", sa.JSON(), nullable=True))

    # Remove current_version column
    op.drop_column("models", "current_version")

    # Drop model_versions table
    op.drop_index(op.f("ix_model_versions_version"), table_name="model_versions")
    op.drop_table("model_versions")

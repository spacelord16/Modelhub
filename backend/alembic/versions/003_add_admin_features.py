"""Add admin features

Revision ID: 003_add_admin_features
Revises: b9a61fb77812
Create Date: 2024-01-15 10:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "003_add_admin_features"
down_revision = "b9a61fb77812"
branch_labels = None
depends_on = None


def upgrade():
    # Add user role and activity tracking columns
    op.add_column(
        "users",
        sa.Column(
            "role",
            sa.Enum("USER", "MODERATOR", "ADMIN", "SUPER_ADMIN", name="userrole"),
            nullable=True,
        ),
    )
    op.add_column(
        "users", sa.Column("last_login", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column("users", sa.Column("login_count", sa.Integer(), nullable=True))

    # Set default role for existing users
    op.execute("UPDATE users SET role = 'USER' WHERE role IS NULL")
    op.execute("UPDATE users SET login_count = 0 WHERE login_count IS NULL")

    # Add model approval workflow columns
    op.add_column(
        "models",
        sa.Column(
            "status",
            sa.Enum("PENDING", "APPROVED", "REJECTED", "SUSPENDED", name="modelstatus"),
            nullable=True,
        ),
    )
    op.add_column(
        "models",
        sa.Column(
            "deployment_status",
            sa.Enum(
                "INACTIVE", "ACTIVE", "EMERGENCY_DISABLED", name="deploymentstatus"
            ),
            nullable=True,
        ),
    )
    op.add_column("models", sa.Column("reviewed_by", sa.Integer(), nullable=True))
    op.add_column(
        "models", sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column("models", sa.Column("review_notes", sa.Text(), nullable=True))

    # Set defaults for existing models
    op.execute("UPDATE models SET status = 'PENDING' WHERE status IS NULL")
    op.execute(
        "UPDATE models SET deployment_status = 'INACTIVE' WHERE deployment_status IS NULL"
    )

    # For SQLite, we'll skip the foreign key constraint as it's not essential for functionality
    # The relationship will still work through the ORM

    # Create platform analytics table
    op.create_table(
        "platform_analytics",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column(
            "date",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=True,
        ),
        sa.Column("total_users", sa.Integer(), nullable=True),
        sa.Column("active_users_today", sa.Integer(), nullable=True),
        sa.Column("total_models", sa.Integer(), nullable=True),
        sa.Column("models_uploaded_today", sa.Integer(), nullable=True),
        sa.Column("total_downloads", sa.Integer(), nullable=True),
        sa.Column("downloads_today", sa.Integer(), nullable=True),
        sa.Column("pending_approvals", sa.Integer(), nullable=True),
        sa.Column("approved_models_today", sa.Integer(), nullable=True),
        sa.Column("rejected_models_today", sa.Integer(), nullable=True),
        sa.Column("emergency_disabled_count", sa.Integer(), nullable=True),
        sa.Column("detailed_metrics", sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_platform_analytics_id"), "platform_analytics", ["id"], unique=False
    )

    # Create user activities table
    op.create_table(
        "user_activities",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("activity_type", sa.String(), nullable=True),
        sa.Column("activity_details", sa.JSON(), nullable=True),
        sa.Column("ip_address", sa.String(), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_user_activities_id"), "user_activities", ["id"], unique=False
    )

    # Create model activities table
    op.create_table(
        "model_activities",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("model_id", sa.Integer(), nullable=True),
        sa.Column("activity_type", sa.String(), nullable=True),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("activity_details", sa.JSON(), nullable=True),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["model_id"],
            ["models.id"],
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_model_activities_id"), "model_activities", ["id"], unique=False
    )


def downgrade():
    # Drop new tables
    op.drop_index(op.f("ix_model_activities_id"), table_name="model_activities")
    op.drop_table("model_activities")
    op.drop_index(op.f("ix_user_activities_id"), table_name="user_activities")
    op.drop_table("user_activities")
    op.drop_index(op.f("ix_platform_analytics_id"), table_name="platform_analytics")
    op.drop_table("platform_analytics")

    # Remove model approval columns
    op.drop_column("models", "review_notes")
    op.drop_column("models", "reviewed_at")
    op.drop_column("models", "reviewed_by")
    op.drop_column("models", "deployment_status")
    op.drop_column("models", "status")

    # Remove user role columns
    op.drop_column("users", "login_count")
    op.drop_column("users", "last_login")
    op.drop_column("users", "role")

    # Drop enums (SQLite will handle this automatically)

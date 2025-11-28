from alembic import op
import sqlalchemy as sa

revision = '0001_init'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('tenants',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(), index=True)
    )
    op.create_table('organizations',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(), index=True),
        sa.Column('tenant_id', sa.Integer(), sa.ForeignKey('tenants.id'), nullable=False, index=True),
        sa.Column('sector', sa.String(), nullable=True)
    )
    op.create_table('contacts',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('first_name', sa.String(), index=True),
        sa.Column('last_name', sa.String(), index=True),
        sa.Column('email', sa.String(), nullable=True, unique=True, index=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.id'), nullable=True),
        sa.Column('tenant_id', sa.Integer(), sa.ForeignKey('tenants.id'), nullable=False, index=True),
        sa.Column('client_type', sa.String(), nullable=True),
        sa.Column('lead_source', sa.String(), nullable=True)
    )
    op.create_table('stages',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(), index=True),
        sa.Column('order', sa.Integer(), index=True),
        sa.Column('tenant_id', sa.Integer(), sa.ForeignKey('tenants.id'), nullable=False, index=True)
    )
    op.create_table('deals',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('title', sa.String(), index=True),
        sa.Column('value', sa.Float(), default=0.0),
        sa.Column('status', sa.String(), index=True),
        sa.Column('stage_id', sa.Integer(), sa.ForeignKey('stages.id'), nullable=True),
        sa.Column('contact_id', sa.Integer(), sa.ForeignKey('contacts.id'), nullable=True),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.id'), nullable=True),
        sa.Column('tenant_id', sa.Integer(), sa.ForeignKey('tenants.id'), nullable=False, index=True),
        sa.Column('main_issue', sa.String(), nullable=True),
        sa.Column('estimated_value', sa.Float(), nullable=True),
        sa.Column('opened_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('closed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('email_open_rate', sa.Float(), nullable=True),
        sa.Column('interactions_total', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('docs_shared', sa.Boolean(), nullable=False, server_default=sa.text('0'))
    )
    op.create_table('audit_logs',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('tenant_id', sa.Integer(), sa.ForeignKey('tenants.id'), nullable=False, index=True),
        sa.Column('entity_name', sa.String(length=64), nullable=False, index=True),
        sa.Column('entity_id', sa.String(length=128), nullable=False, index=True),
        sa.Column('action', sa.String(length=16), nullable=False),
        sa.Column('actor', sa.String(length=128), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('before', sa.JSON(), nullable=True),
        sa.Column('after', sa.JSON(), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True)
    )
    op.create_table('lead_scores',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('tenant_id', sa.Integer(), sa.ForeignKey('tenants.id'), nullable=False, index=True),
        sa.Column('contact_id', sa.Integer(), sa.ForeignKey('contacts.id'), nullable=True, index=True),
        sa.Column('deal_id', sa.Integer(), sa.ForeignKey('deals.id'), nullable=True, index=True),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('model_version', sa.String(), nullable=False),
        sa.Column('factors', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )
    op.create_table('document_types',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('tenant_id', sa.Integer(), sa.ForeignKey('tenants.id'), nullable=False, index=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('code', sa.String(), nullable=True, index=True),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('allowed_mime_types', sa.JSON(), nullable=True)
    )
    op.create_table('deal_required_documents',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('tenant_id', sa.Integer(), sa.ForeignKey('tenants.id'), nullable=False, index=True),
        sa.Column('deal_id', sa.Integer(), sa.ForeignKey('deals.id'), nullable=False, index=True),
        sa.Column('document_type_id', sa.Integer(), sa.ForeignKey('document_types.id'), nullable=False, index=True),
        sa.Column('required_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )
    op.create_table('organization_required_documents',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('tenant_id', sa.Integer(), sa.ForeignKey('tenants.id'), nullable=False, index=True),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.id'), nullable=False, index=True),
        sa.Column('document_type_id', sa.Integer(), sa.ForeignKey('document_types.id'), nullable=False, index=True),
        sa.Column('required_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )
    op.create_table('document_uploads',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('tenant_id', sa.Integer(), sa.ForeignKey('tenants.id'), nullable=False, index=True),
        sa.Column('deal_id', sa.Integer(), sa.ForeignKey('deals.id'), nullable=False, index=True),
        sa.Column('document_type_id', sa.Integer(), sa.ForeignKey('document_types.id'), nullable=False, index=True),
        sa.Column('contact_id', sa.Integer(), sa.ForeignKey('contacts.id'), nullable=True, index=True),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('original_filename', sa.String(), nullable=False),
        sa.Column('mime_type', sa.String(), nullable=True),
        sa.Column('size_bytes', sa.Integer(), nullable=True),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )
    op.create_table('profiles',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('tenant_id', sa.Integer(), sa.ForeignKey('tenants.id'), nullable=False, index=True),
        sa.Column('name', sa.String(), nullable=False, index=True),
        sa.Column('code', sa.String(), nullable=True, index=True)
    )
    op.create_table('role_permissions',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('tenant_id', sa.Integer(), sa.ForeignKey('tenants.id'), nullable=False, index=True),
        sa.Column('role', sa.String(), nullable=False, index=True),
        sa.Column('resource', sa.String(), nullable=False, index=True),
        sa.Column('actions', sa.JSON(), nullable=False)
    )
    op.create_table('users',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('tenant_id', sa.Integer(), sa.ForeignKey('tenants.id'), nullable=False, index=True),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('email', sa.String(), nullable=False, unique=True, index=True),
        sa.Column('role', sa.String(), nullable=False, index=True),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('must_change_password', sa.Boolean(), nullable=False, server_default=sa.text('1'))
    )

def downgrade():
    op.drop_table('users')
    op.drop_table('role_permissions')
    op.drop_table('profiles')
    op.drop_table('document_uploads')
    op.drop_table('organization_required_documents')
    op.drop_table('deal_required_documents')
    op.drop_table('document_types')
    op.drop_table('lead_scores')
    op.drop_table('audit_logs')
    op.drop_table('deals')
    op.drop_table('stages')
    op.drop_table('contacts')
    op.drop_table('organizations')
    op.drop_table('tenants')


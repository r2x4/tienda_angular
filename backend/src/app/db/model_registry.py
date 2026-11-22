"""Model registry for Alembic autogenerate.

Import all SQLAlchemy model modules here so that Base.metadata is fully populated
when Alembic runs migrations.
"""

from app.modules.auth import models as auth_models  # noqa: F401
from app.modules.catalog import models as catalog_models  # noqa: F401
from app.modules.cart import models as cart_models  # noqa: F401
from app.modules.orders import models as orders_models  # noqa: F401
# Future model imports will be added here, for example:
# from app.modules.inventory import models as inventory_models  # noqa: F401
from app.modules.services_admin import models as services_admin_models  # noqa: F401


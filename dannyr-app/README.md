# DannyR — Sistema Operativo de Live Selling

Sistema interno para gestionar ventas de prendas únicas durante TikTok Lives.
Reemplaza el caos operativo de WhatsApp, pagos y envíos con un flujo digital ordenado.

## Stack Tecnológico

- **Frontend**: Next.js 16 (App Router, TypeScript)
- **Backend**: Next.js API Route Handlers
- **Base de datos**: Supabase PostgreSQL
- **WhatsApp**: WhatsApp Cloud API (Meta)
- **Hosting**: Vercel

## Módulos

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| Inventario | `/dashboard/inventory` | Gestión de prendas (CRUD, búsqueda, archivado) |
| Pedidos | `/dashboard/orders` | Pedidos pendientes de pago con temporizador |
| Envíos | `/dashboard/shipments` | Envíos activos con colores por cliente |
| Historial Pedidos | `/dashboard/history/orders` | Todos los pedidos finalizados |
| Historial Envíos | `/dashboard/history/shipments` | Todos los envíos entregados |

## Setup

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.local.example .env.local
# Editar .env.local con tus credenciales de Supabase y WhatsApp
```

### 3. Configurar base de datos
Ejecutar el contenido de `supabase/migrations/001_initial_schema.sql` en el SQL Editor de Supabase.

### 4. Ejecutar en desarrollo
```bash
npm run dev
```

### 5. Deploy a Vercel
```bash
vercel
```

## API Endpoints

| Método | Ruta | Uso |
|--------|------|-----|
| GET/POST | `/api/garments` | Listar/crear prendas |
| PATCH/DELETE | `/api/garments/[id]` | Editar/archivar prenda |
| POST | `/api/reserve` | Reservar prenda (atómico) |
| GET | `/api/orders` | Listar pedidos |
| PATCH | `/api/orders/[id]` | Confirmar pago / cancelar |
| GET | `/api/shipments` | Listar envíos |
| PATCH | `/api/shipments/[id]` | Cambiar estado de envío |
| POST | `/api/shipments/groups` | Crear grupo de envío |
| GET | `/api/cron/expire-reservations` | Expirar reservas (cron) |
| GET/POST | `/api/webhooks/whatsapp` | Webhook de WhatsApp |

## Flujo del Negocio

1. Se muestra prenda en TikTok Live con código (ej: ABC-001)
2. Clienta escribe al WhatsApp del negocio
3. Bot guía: CONSULTA o TENGO UNA SEPARACIÓN
4. Si separa: pide nombre + código → reserva atómica (30 min)
5. Operador revisa pago en panel → marca PAGADO
6. Bot continúa automáticamente pidiendo datos de envío
7. Pedido pasa a Envíos → operador gestiona despacho
8. Al marcar DELIVERED → prenda se archiva automáticamente

## Configuración WhatsApp Cloud API

1. Crear cuenta en [Meta for Developers](https://developers.facebook.com/)
2. Crear app de tipo Business
3. Agregar producto WhatsApp
4. Obtener Access Token permanente (System User)
5. Configurar webhook URL: `https://tu-dominio.vercel.app/api/webhooks/whatsapp`
6. Suscribir a eventos: `messages`

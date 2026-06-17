# Subtexto Pro - Guia completa (IA + Stripe + Vercel)

Esta version esta lista para PRODUCCION: usa Gemini para la IA y Stripe para
cobrar de verdad las membresias. Sigue los pasos en orden.

ARCHIVOS:
- index.html          -> la web
- api/analizar.js     -> servidor de IA (Gemini)
- api/checkout.js     -> crea el pago en Stripe
- api/verify.js       -> confirma el pago al volver de Stripe
- package.json        -> incluye la libreria de Stripe (Vercel la instala sola)

================================================================
PARTE 1 - SUBIR Y PROBAR LA IA (sin Stripe todavia)
================================================================

1. Sube TODO el contenido de esta carpeta a un repositorio de GitHub
   (index.html, la carpeta api con sus 3 archivos, y package.json).
2. En Vercel: Add New -> Project -> importa el repositorio -> Deploy.
3. Settings -> Environment Variables, anade:
     GEMINI_API_KEY = tu llave de Gemini (la que empieza por AIza)
4. Deployments -> ... -> Redeploy.
5. Abre la web y prueba un mensaje. La IA debe responder.

================================================================
PARTE 2 - CONECTAR STRIPE PARA COBRAR
================================================================

PASO A - Crear cuenta y productos en Stripe
1. Crea cuenta en https://stripe.com y verifica tu banco.
2. Empieza en MODO PRUEBA (interruptor "Test mode" arriba a la derecha).
3. Products -> Add product:
   - "Subtexto Pro Mensual": 4,99 EUR recurrente mensual. Copia el ID del
     PRECIO (empieza por price_...).
   - "Subtexto Pro Anual": 19,99 EUR recurrente anual. Copia su price_...

PASO B - Llave secreta de Stripe
- Developers -> API keys -> copia la "Secret key" (sk_test_... en prueba).

PASO C - Variables en Vercel (ademas de GEMINI_API_KEY)
     STRIPE_SECRET_KEY = sk_test_...
     STRIPE_PRICE_MES  = price_...   (mensual)
     STRIPE_PRICE_ANO  = price_...   (anual)
   Guarda y Redeploy.

PASO D - Probar el pago (modo prueba)
- Pulsa "Empezar", te lleva a Stripe. Usa la tarjeta de prueba:
     4242 4242 4242 4242 , fecha futura, CVC cualquiera.
- Al pagar, vuelve a la web y se activa "Pro".

PASO E - Pasar a COBRO REAL
- Apaga Test mode, recrea productos en modo real, copia los price_ reales y
  la Secret key real (sk_live_...), actualiza las 3 variables en Vercel y
  Redeploy. Ya es dinero real.

================================================================
NOTAS IMPORTANTES
================================================================
- Los 3 usos diarios se guardan en el navegador (se reinician cada dia). Es
  friccion suave; para control total hace falta cuentas + base de datos.
- El acceso Pro se guarda en el navegador del usuario. Cambiar de dispositivo
  requiere gestionar la suscripcion desde el correo de Stripe. Un login por
  email lo resolveria; se puede anadir luego.
- IA: usa gemini-2.0-flash. Si Google lo retira, cambia el nombre en
  api/analizar.js (p.ej. gemini-2.5-flash).
- Pon un limite de gasto en Google y recuerda que Stripe cobra ~1,5% por pago.

import { ArrowLeft, ExternalLink, Mail } from "lucide-react";
import { SOURCE_REPOSITORY_URL } from "../lib/site-links";

const CONTACT_EMAIL = "u3849730636@gmail.com";

type LegalPageKind = "data-protection" | "privacy";

interface LegalPageProps {
  kind: LegalPageKind;
}

function LegalHeader({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <header className="legal-hero">
      <a className="legal-brand" href="/" aria-label="Volver a Sysvexa Technologies">
        <img src="/brand/sysvexa-header.png" alt="Sysvexa Technologies" />
      </a>
      <div className="legal-hero-copy">
        <span className="kicker">{eyebrow}</span>
        <h1>{title}</h1>
        <p>
          Esta información explica de forma clara qué datos se tratan, por qué se
          necesitan y cómo puedes ejercer tus derechos.
        </p>
        <p className="legal-updated">Última actualización: 3 de septiembre de 2026</p>
      </div>
    </header>
  );
}

function ContactLink() {
  return (
    <a className="legal-inline-link" href={`mailto:${CONTACT_EMAIL}`}>
      <Mail size={16} aria-hidden="true" /> {CONTACT_EMAIL}
    </a>
  );
}

function DataProtectionContent() {
  return (
    <>
      <LegalHeader eyebrow="Formulario de servicios" title="Información sobre protección de datos" />
      <main className="legal-content" id="contenido">
        <section className="legal-summary" aria-labelledby="resumen-proteccion-datos">
          <h2 id="resumen-proteccion-datos">Resumen del tratamiento</h2>
          <dl>
            <div><dt>Responsable</dt><dd>Sysvexa Technologies, titular del sitio.</dd></div>
            <div><dt>Finalidad</dt><dd>Atender tu solicitud, contactar contigo, preparar un presupuesto y, si procede, prestar y seguir el servicio.</dd></div>
            <div><dt>Base jurídica</dt><dd>Medidas precontractuales solicitadas por ti y, cuando se contrate, ejecución del servicio. Las obligaciones legales se atenderán cuando resulten aplicables.</dd></div>
            <div><dt>Destinatarios</dt><dd>Proveedores tecnológicos necesarios para recibir, proteger y gestionar la solicitud. No se venden tus datos.</dd></div>
            <div><dt>Derechos</dt><dd>Acceso, rectificación, supresión, oposición, limitación y portabilidad cuando corresponda.</dd></div>
          </dl>
        </section>

        <section>
          <h2>Responsable del tratamiento</h2>
          <p><strong>Responsable:</strong> Sysvexa Technologies, titular del sitio web.</p>
          <p><strong>Contacto para privacidad y ejercicio de derechos:</strong> <ContactLink /></p>
          <p><strong>Ámbito de prestación:</strong> Jaén, con servicio remoto y presencial según la zona.</p>
        </section>

        <section>
          <h2>Datos que se recogen</h2>
          <p>El formulario solicita el nombre, el correo electrónico, un teléfono opcional, el producto elegido y la descripción de la necesidad. También se registran un identificador, la fecha, el idioma, el estado de gestión y la confirmación de que se ha leído esta información.</p>
          <p>No incluyas contraseñas, datos bancarios, documentos de identidad ni información de terceras personas que no sea imprescindible para explicar la solicitud.</p>
        </section>

        <section>
          <h2>Finalidades y base jurídica</h2>
          <ul>
            <li>Responder a la consulta y valorar la necesidad comunicada.</li>
            <li>Contactar contigo y preparar un presupuesto.</li>
            <li>Gestionar la contratación, prestación y seguimiento del servicio si lo solicitas.</li>
            <li>Cumplir obligaciones administrativas, contables o legales cuando resulten aplicables.</li>
          </ul>
          <p>El tratamiento necesario para responder, preparar un presupuesto o tramitar el servicio se basa en las medidas precontractuales solicitadas por la persona interesada y, después, en la ejecución de la relación contractual. La casilla del formulario confirma la lectura de esta información; no autoriza el envío de publicidad.</p>
        </section>

        <section>
          <h2>Conservación</h2>
          <p>Los datos se conservarán mientras sean necesarios para tramitar y seguir la solicitud. Si no se inicia una relación de servicio, se eliminarán cuando ya no resulte razonable esperar su reactivación. Si existe contratación, facturación, una reclamación o una obligación legal, se conservará únicamente la información necesaria durante los plazos aplicables y después se eliminará o bloqueará.</p>
          <p>La primera versión del sistema no ejecuta un borrado automático: las solicitudes se revisan y eliminan manualmente desde Cloudflare D1. La recuperación técnica temporal de la base de datos no amplía la finalidad del tratamiento.</p>
        </section>

        <section>
          <h2>Proveedores y destinatarios</h2>
          <p>Para operar el formulario intervienen proveedores tecnológicos necesarios: Cloudflare para Turnstile, Workers, D1 y el aviso de correo; Amazon Web Services para alojar la web; y Google para el buzón de contacto. Si eliges pagar, Stripe recibe directamente la información de pago en su página alojada. Sysvexa no recibe ni almacena los datos completos de tu tarjeta desde este formulario.</p>
          <p>Los datos solo se comunicarán a terceros cuando sea necesario para prestar el servicio, exista una obligación legal o el proveedor actúe conforme a las garantías contractuales aplicables.</p>
        </section>

        <section>
          <h2>Transferencias internacionales</h2>
          <p>Algunos proveedores pueden tratar información fuera del Espacio Económico Europeo. Cuando ocurra, el tratamiento deberá apoyarse en una decisión de adecuación, cláusulas contractuales tipo u otra garantía admitida por la normativa. Puedes consultar los detalles en la <a href="/politica-de-privacidad">Política de privacidad</a>.</p>
        </section>

        <section>
          <h2>Tus derechos</h2>
          <p>Puedes solicitar acceso, rectificación, supresión, oposición, limitación o portabilidad cuando resulte aplicable. Escribe a <ContactLink /> indicando qué derecho deseas ejercer. Podrá solicitarse información razonable para verificar tu identidad.</p>
          <p>También puedes presentar una reclamación ante la <a className="legal-inline-link" href="https://www.aepd.es/" target="_blank" rel="noreferrer">Agencia Española de Protección de Datos <ExternalLink size={15} aria-hidden="true" /></a>.</p>
        </section>

        <section>
          <h2>Cifrado y protección de las solicitudes</h2>
          <p>El formulario se ofrece mediante HTTPS. Los datos viajan cifrados con TLS 1.2 o TLS 1.3 desde el navegador hasta el servidor web y desde este hasta el Worker de Cloudflare. El sitio utiliza HSTS para indicar a los navegadores compatibles que deben volver a conectarse mediante HTTPS.</p>
          <p>Cloudflare D1 cifra automáticamente la base de datos en reposo con AES-256 y protege mediante TLS las comunicaciones entre el Worker y D1. Cloudflare administra las claves de ese cifrado. Estas medidas se complementan con controles de acceso y no sustituyen la revisión de quién puede consultar o eliminar las solicitudes.</p>
          <p>Las claves privadas de Turnstile y otros secretos operativos se mantienen en la configuración protegida del Worker y no se incluyen en el código enviado al navegador. No se añade una clave AES compartida al formulario porque quedaría expuesta en el JavaScript público y no ofrecería una protección adicional fiable frente a TLS.</p>
          <p>Si eliges pagar, la redirección se limita a páginas HTTPS alojadas en los dominios de pago autorizados de Stripe. El enlace de redirección no incorpora los datos escritos en el formulario y los datos completos de la tarjeta se introducen directamente en Stripe.</p>
        </section>

        <section>
          <h2>Otras medidas y datos obligatorios</h2>
          <p>Los campos marcados con un asterisco son necesarios para tramitar la solicitud. Se aplican verificación de origen, validación y limitación de tamaño, protección frente a automatizaciones con Turnstile, restricciones sobre los destinos de pago y registros técnicos con rotación para reducir el riesgo de acceso, alteración o pérdida indebidos.</p>
          <p>Ninguna transmisión por Internet puede presentarse como exenta de todo riesgo. Las medidas se revisarán y actualizarán cuando cambien el servicio, los riesgos o el estado de la técnica.</p>
        </section>

        <section>
          <h2>Normativa y fuentes oficiales</h2>
          <p>Esta información se estructura conforme al deber de transparencia y al modelo de información por capas. Puedes consultar el <a className="legal-inline-link" href="https://eur-lex.europa.eu/eli/reg/2016/679/oj/spa" target="_blank" rel="noreferrer">Reglamento General de Protección de Datos <ExternalLink size={15} aria-hidden="true" /></a>, la <a className="legal-inline-link" href="https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673" target="_blank" rel="noreferrer">Ley Orgánica 3/2018 <ExternalLink size={15} aria-hidden="true" /></a> y la <a className="legal-inline-link" href="https://www.aepd.es/preguntas-frecuentes/2-tus-obligaciones-como-responsable-del-tratamiento/6-el-deber-de-informacion/FAQ-0217-que-informacion-debe-facilitarse-cuando-los-datos-se-obtengan-directamente-del-afectado" target="_blank" rel="noreferrer">guía de la AEPD <ExternalLink size={15} aria-hidden="true" /></a>.</p>
        </section>
      </main>
    </>
  );
}

function PrivacyContent() {
  return (
    <>
      <LegalHeader eyebrow="Privacidad del sitio" title="Política de privacidad" />
      <main className="legal-content" id="contenido">
        <section>
          <h2>Alcance</h2>
          <p>Esta política describe los tratamientos asociados a sysvexatechnologies.com: navegación, preferencias, solicitudes de servicio, contacto por correo y pagos alojados por Stripe.</p>
        </section>

        <section>
          <h2>Responsable y contacto</h2>
          <p><strong>Responsable:</strong> Sysvexa Technologies, titular del sitio web.</p>
          <p><strong>Contacto de privacidad:</strong> <ContactLink /></p>
          <p><strong>Ámbito de prestación:</strong> Jaén, con servicio remoto y presencial según la zona.</p>
        </section>

        <section>
          <h2>Tratamientos realizados</h2>
          <div className="legal-table-wrap">
            <table>
              <thead><tr><th>Actividad</th><th>Datos y finalidad</th><th>Base jurídica</th></tr></thead>
              <tbody>
                <tr><td>Solicitudes de servicio</td><td>Datos de contacto, producto, descripción, idioma y seguimiento para responder, presupuestar y prestar el servicio.</td><td>Medidas precontractuales y ejecución contractual.</td></tr>
                <tr><td>Seguridad técnica</td><td>Dirección IP y metadatos técnicos limitados para detectar abuso, proteger el sitio y resolver incidencias.</td><td>Interés legítimo en mantener la seguridad y disponibilidad.</td></tr>
                <tr><td>Contacto por correo</td><td>Dirección, contenido y metadatos del mensaje para atender la comunicación.</td><td>Medidas precontractuales, ejecución contractual o interés legítimo en responder.</td></tr>
                <tr><td>Pagos</td><td>Stripe recoge los datos necesarios en su pasarela; Sysvexa recibe la confirmación e información comercial necesaria para gestionar el servicio.</td><td>Ejecución contractual y obligaciones legales.</td></tr>
                <tr><td>Preferencia de idioma</td><td>El idioma elegido se guarda en el almacenamiento local del navegador para recordar la interfaz.</td><td>Preferencia solicitada por la persona usuaria; no se usa con fines publicitarios.</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>Servicios tecnológicos</h2>
          <ul className="legal-provider-list">
            <li><a href="https://www.cloudflare.com/es-es/privacypolicy/" target="_blank" rel="noreferrer">Cloudflare <ExternalLink size={14} aria-hidden="true" /></a>: protección antiabuso, ejecución del formulario, base D1 y aviso de nuevas solicitudes.</li>
            <li><a href="https://aws.amazon.com/es/privacy/" target="_blank" rel="noreferrer">Amazon Web Services <ExternalLink size={14} aria-hidden="true" /></a>: alojamiento de los archivos públicos y registros de acceso del servidor.</li>
            <li><a href="https://policies.google.com/privacy?hl=es" target="_blank" rel="noreferrer">Google <ExternalLink size={14} aria-hidden="true" /></a>: buzón de contacto y comunicaciones posteriores.</li>
            <li><a href="https://stripe.com/es/privacy" target="_blank" rel="noreferrer">Stripe <ExternalLink size={14} aria-hidden="true" /></a>: páginas alojadas de pago, únicamente cuando decides utilizarlas.</li>
          </ul>
          <p>Los proveedores pueden cambiar si resulta necesario para operar el servicio. Esta política se actualizará cuando el cambio afecte de forma relevante al tratamiento.</p>
        </section>

        <section>
          <h2>Seguridad y cifrado</h2>
          <p>Las conexiones públicas del sitio, el envío del formulario y la redirección a Stripe utilizan HTTPS con TLS 1.2 o TLS 1.3. HSTS ayuda a evitar que el navegador vuelva a utilizar una conexión sin cifrar. El servidor y el Worker rechazan el envío del formulario mediante HTTP público.</p>
          <p>Las solicitudes se almacenan en Cloudflare D1, que cifra automáticamente sus objetos en reposo con AES-256 y protege con TLS el tráfico entre el Worker y la base de datos. Las claves de ese cifrado son administradas por Cloudflare. Los secretos operativos no se entregan al navegador.</p>
          <p>Se aplican controles adicionales de origen, tamaño y formato de los datos, protección frente a automatizaciones, restricción exacta de los destinos de pago y rotación de registros técnicos. Estas medidas buscan preservar la confidencialidad, integridad y disponibilidad de la información y se revisan de acuerdo con el riesgo.</p>
        </section>

        <section>
          <h2>Conservación</h2>
          <p>Las solicitudes se conservan mientras sea necesario gestionarlas y durante los plazos relacionados con el servicio, las obligaciones legales o posibles reclamaciones. Los registros de acceso del servidor rotan y tienen una conservación operativa máxima configurada de 30 días. La preferencia de idioma permanece en el navegador hasta que se cambie o se borre el almacenamiento local.</p>
        </section>

        <section>
          <h2>Cookies y almacenamiento local</h2>
          <p>La web no instala analítica ni publicidad propia. Utiliza almacenamiento local para recordar el idioma y carga Cloudflare Turnstile en el formulario para comprobar solicitudes automatizadas. Turnstile puede usar la información técnica necesaria para prestar su función de seguridad conforme a la política de Cloudflare.</p>
        </section>

        <section>
          <h2>Destinatarios y transferencias</h2>
          <p>No se venden datos personales. Solo acceden los proveedores necesarios, las personas que deban prestar el servicio o las autoridades cuando exista obligación legal. Si un proveedor trata datos fuera del Espacio Económico Europeo, se aplicarán las garantías admitidas por la normativa, como decisiones de adecuación o cláusulas contractuales tipo.</p>
        </section>

        <section>
          <h2>Derechos</h2>
          <p>Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad cuando correspondan escribiendo a <ContactLink />. También puedes reclamar ante la <a className="legal-inline-link" href="https://www.aepd.es/" target="_blank" rel="noreferrer">AEPD <ExternalLink size={15} aria-hidden="true" /></a>.</p>
        </section>

        <section>
          <h2>Información específica del formulario</h2>
          <p>Consulta la <a href="/proteccion-de-datos">Información sobre protección de datos</a> para ver el detalle aplicable a una solicitud de servicio.</p>
        </section>

        <section>
          <h2>Código fuente y enlace a GitHub</h2>
          <p>El pie de página contiene un enlace externo al repositorio público del sitio en GitHub. Sysvexa no carga scripts, imágenes ni otros recursos de GitHub al mostrar esta web. GitHub recibirá la información técnica propia de una navegación externa solo si decides abrir el enlace y aplicará su propia política de privacidad.</p>
          <p>El repositorio contiene código y documentación técnica; no contiene las solicitudes guardadas en D1, las claves privadas ni los secretos del Worker.</p>
        </section>
      </main>
    </>
  );
}

export function LegalPage({ kind }: LegalPageProps) {
  return (
    <div className="legal-page" lang="es">
      {kind === "data-protection" ? <DataProtectionContent /> : <PrivacyContent />}
      <footer className="legal-footer">
        <a href="/"><ArrowLeft size={17} aria-hidden="true" /> Volver a la página principal</a>
        <nav aria-label="Documentos legales">
          <a href="/proteccion-de-datos">Protección de datos</a>
          <a href="/politica-de-privacidad">Política de privacidad</a>
          <a href={SOURCE_REPOSITORY_URL} target="_blank" rel="noreferrer">
            <ExternalLink size={15} aria-hidden="true" /> GitHub
          </a>
        </nav>
      </footer>
    </div>
  );
}

export function resolveLegalPage(pathname: string): LegalPageKind | null {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  if (normalizedPath === "/proteccion-de-datos") return "data-protection";
  if (normalizedPath === "/politica-de-privacidad") return "privacy";
  return null;
}

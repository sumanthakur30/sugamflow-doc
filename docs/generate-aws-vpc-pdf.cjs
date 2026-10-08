/**
 * Generates docs/AWS-VPC-Deployment-Plan-SugamFlow.pdf
 * Embeds PNG diagrams from docs/diagrams/ (run npm run diagrams if missing).
 * Run: npm run pdf
 */
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const outPath = path.join(__dirname, "AWS-VPC-Deployment-Plan-SugamFlow.pdf");
const diagramsDir = path.join(__dirname, "diagrams");

const sections = [
  {
    title: "AWS VPC deployment plan — SugamFlow",
    body: [
      "Document version: 1.1 — SugamFlow (sugamflow.com, Angular apps, Spring Cloud microservices).",
      "This plan maps the repository stack (config-server, Eureka discovery, API gateway, domain services) to AWS networking and compute patterns suitable for production.",
    ],
  },
  {
    title: "1. High-level workload placement",
    body: [
      "Marketing site (sugamflow.com / sugamflow-landing): S3 static hosting + CloudFront. Optional: keep existing Vercel/Firebase; point DNS accordingly.",
      "Angular shop app (shop-management-ui): S3 + CloudFront or Amplify Hosting. Configure production environment so API base URL points to the public API host (ALB), not individual microservice ports.",
      "Spring Cloud Gateway: the only user-facing HTTP API entry from the internet — Application Load Balancer (ALB) in public subnets → gateway-service (container port 9090) in private subnets.",
      "Config server, Eureka (discovery), and all backend microservices: run only in private subnets with no direct public IPs. Internal service-to-service traffic stays inside the VPC.",
      "SQL Server: RDS for SQL Server (or self-managed SQL on EC2 only if required) in private database subnets. Replace development host.docker.internal with the RDS endpoint and store credentials in AWS Secrets Manager.",
    ],
  },
  {
    title: "2. VPC topology (single region, production-oriented)",
    body: [
      "Use one VPC, for example 10.0.0.0/16, across three Availability Zones for high availability.",
      "Public subnets (e.g. /24 per AZ): Internet Gateway; NAT Gateway per AZ (recommended for production resilience); Application Load Balancer for HTTPS to the API gateway.",
      "Private application subnets: ECS Fargate tasks or EKS worker nodes hosting — config-service (8888), discovery-service (8761), gateway-service (9090), shop, product, stock, order, user, auth, payment, notification, reporting, account services (ports 8080–8089 per compose).",
      "Private database subnets: RDS for SQL Server — no public accessibility.",
      "Optional: VPC interface endpoints (ECR, Secrets Manager, CloudWatch Logs, SSM) to reduce NAT dependency and tighten egress controls.",
    ],
  },
  {
    title: "3. Traffic flow (summary)",
    body: [
      "End users → CloudFront → S3: static assets for the marketing site and the Angular application.",
      "End users → api.sugamflow.com → ALB (HTTPS) → gateway-service → downstream microservices via load-balanced internal names (Eureka / ECS Service Discovery / Cloud Map).",
      "Microservices → config-service and discovery-service: VPC-internal only.",
      "Microservices → RDS: SQL Server port 1433 from application security groups only.",
      "Do not expose Eureka (8761), config (8888), or individual REST ports on a public load balancer; only the gateway should be internet-facing for API traffic.",
    ],
  },
  {
    title: "4. Security groups (minimal model)",
    body: [
      "alb-sg: inbound TCP 443 from the internet (or restrict to CloudFront/origin patterns if applicable).",
      "gateway-sg: inbound from alb-sg only, on the container port for gateway-service.",
      "internal-ms-sg: inbound from gateway-sg and peer microservices as required — restrict ports (8080–8089, 8761, 8888) to least privilege.",
      "rds-sg: inbound TCP 1433 only from internal application security groups.",
    ],
  },
  {
    title: "5. Compute platform",
    body: [
      "Recommended default: Amazon ECS on AWS Fargate + ALB — aligns with your Docker images and reduces operational overhead for a Spring Cloud set of this size.",
      "Alternative: Amazon EKS if you standardize on Kubernetes or need a service mesh (e.g. Istio) later.",
      "Service discovery: you may keep Spring Cloud Eureka initially to minimize code changes; consider AWS Cloud Map / ECS Service Connect over time for simpler operations.",
    ],
  },
  {
    title: "6. Configuration, secrets, and bootstrap order",
    body: [
      "Spring Cloud Config: back the repo with CodeCommit, S3, or private GitHub; restrict access with IAM; run config-service reachable only inside the VPC.",
      "Secrets: AWS Secrets Manager or SSM Parameter Store for SPRING_DATASOURCE_*, SECURITY_JWT_SECRET, mail credentials, and integration keys — inject into task definitions.",
      "Startup dependency order mirrors local Docker Compose: config → discovery → gateway and domain services; use ECS health checks and depends_on semantics.",
    ],
  },
  {
    title: "7. DNS and TLS (sugamflow.com)",
    body: [
      "Amazon Route 53: sugamflow.com and www → CloudFront for static sites; app.sugamflow.com → CloudFront for the Angular app; api.sugamflow.com → ALB.",
      "AWS Certificate Manager: certificates in us-east-1 for CloudFront; in the application region for the ALB.",
    ],
  },
  {
    title: "8. Observability",
    body: [
      "Amazon CloudWatch Logs per ECS service; optional AWS X-Ray from gateway through downstream calls.",
      "Auto scaling on gateway and stateless services; RDS Multi-AZ when budget allows.",
    ],
  },
  {
    title: "9. Service inventory (from docker-compose)",
    body: [
      "Infrastructure: config-service, discovery-service, gateway-service.",
      "Domain: shop-service, product-service, stock-service, order-service, user-service, auth-service, payment-service, notification-service, reporting-service, account-service.",
      "Frontends: static builds for sugamflow-landing and shop-management-ui served via S3/CloudFront; CORS and environment URLs must target the public API host through the gateway.",
    ],
  },
  {
    title: "10. Suggested implementation sequence",
    body: [
      "1) Finalize CIDR and subnet layout; choose ECS Fargate vs EKS.",
      "2) Provision RDS for SQL Server and migrate connection configuration.",
      "3) Push container images to Amazon ECR; define task definitions per service.",
      "4) Create ALB target group pointing only to gateway-service; lock security groups.",
      "5) Set Angular production environment to https://api.sugamflow.com (through gateway).",
    ],
  },
];

const flowDiagrams = [
  {
    title: "Flow diagram A — End-to-end (domain: sugamflow.com)",
    file: "01-end-to-end.png",
    caption:
      "Users, Route 53 records, CloudFront + S3 for marketing and app static files, and api.sugamflow.com → ALB → gateway → internal services and RDS.",
  },
  {
    title: "Flow diagram B — Public hostname roles",
    file: "02-request-paths.png",
    caption:
      "sugamflow.com / www serves marketing; app.sugamflow.com serves the Angular SPA; api.sugamflow.com terminates HTTPS at the ALB and reaches only the gateway.",
  },
  {
    title: "Flow diagram C — VPC internal (east–west)",
    file: "03-vpc-internal.png",
    caption: "ALB to gateway in private subnets; microservices use Eureka, config-server, and RDS without public exposure.",
  },
];

const PAGE_WIDTH_PT = 595.28;
const MARGIN = 56;
const CONTENT_WIDTH = PAGE_WIDTH_PT - 2 * MARGIN;
const MAX_IMAGE_HEIGHT = 620;

function writeSection(doc, section) {
  doc.font("Helvetica-Bold").fontSize(14).text(section.title, { continued: false });
  doc.moveDown(0.6);
  doc.font("Helvetica").fontSize(10.5);
  for (const para of section.body) {
    doc.text(para, { align: "left", paragraphGap: 6 });
    doc.moveDown(0.35);
  }
}

function writeFlowDiagrams(doc) {
  doc.addPage();
  doc.font("Helvetica-Bold").fontSize(14).text("Architecture flow diagrams (sugamflow.com)", { continued: false });
  doc.moveDown(0.5);
  doc.font("Helvetica").fontSize(10.5);
  doc.text(
    "The following figures summarize DNS, edge, and VPC paths. Source: docs/diagrams/*.mmd — regenerate PNG with npm run diagrams.",
    { align: "left" }
  );

  flowDiagrams.forEach((fig) => {
    doc.addPage();
    const imgPath = path.join(diagramsDir, fig.file);
    doc.font("Helvetica-Bold").fontSize(12).text(fig.title, { continued: false });
    doc.moveDown(0.45);
    doc.font("Helvetica").fontSize(9.5);

    if (!fs.existsSync(imgPath)) {
      doc.fillColor("#cc0000");
      doc.text(`Missing image: ${fig.file}. Run: npm run diagrams`, { align: "left" });
      doc.fillColor("#000000");
      doc.moveDown(0.35);
      doc.text(fig.caption, { align: "left" });
      return;
    }

    const imgMeta = doc.openImage(imgPath);
    const scale = Math.min(CONTENT_WIDTH / imgMeta.width, MAX_IMAGE_HEIGHT / imgMeta.height);
    const drawW = imgMeta.width * scale;
    const drawH = imgMeta.height * scale;
    const xCentered = MARGIN + (CONTENT_WIDTH - drawW) / 2;
    const yBefore = doc.y;
    doc.image(imgPath, xCentered, yBefore, { width: drawW });
    doc.y = yBefore + drawH;
    doc.x = MARGIN;
    doc.moveDown(0.35);
    doc.text(fig.caption, { align: "left" });
  });
}

function writePdf() {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
    info: {
      Title: "AWS VPC Deployment Plan — SugamFlow",
      Author: "SugamFlow",
      Subject: "AWS architecture",
    },
  });
  const stream = fs.createWriteStream(outPath);
  doc.pipe(stream);

  doc.font("Helvetica");
  let isFirst = true;

  for (let i = 0; i < sections.length; i++) {
    if (!isFirst) doc.addPage();
    isFirst = false;
    writeSection(doc, sections[i]);
    if (i === 3) {
      writeFlowDiagrams(doc);
      isFirst = false;
    }
  }

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve(outPath));
    stream.on("error", reject);
  });
}

writePdf()
  .then((p) => {
    console.log("Wrote:", p);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

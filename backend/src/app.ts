import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import routes from "./routes";
import { swaggerOptions } from "./config/swagger";
import { errorHandler } from "./middlewares/errorMiddleware";
import { env } from "./config/env";

const app = express();

app.use(cors());
app.use(express.json());

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/api", routes);

app.use(errorHandler);

export const startServer = () => {
  app.listen(env.PORT, () => {
    console.log(`🚀 API rodando na porta ${env.PORT}`);
  });
};

export default app;

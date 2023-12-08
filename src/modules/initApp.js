import { dbConnection } from "../../DB/dbConnection.js";
import path from "path";
import { config } from "dotenv";
config({ path: path.resolve("config/.env") });
const port = process.env.PORT || 3001;
import { AppError, globalErrorHandel } from "../utils/globalError.js";

import userRoutes from "../modules/user/user.routes.js";
import ownerRoutes from "../modules/owner/owner.routes.js";
import propertyRoutes from "../modules/property/property.routes.js";
import categoryRoutes from "../modules/category/category.routes.js";
import subCategoryRoutes from "../modules/subCategory/subCategory.routes.js";
import rentRoutes from "../modules/rent/rent.routes.js";
import reviewRoutes from "../modules/review/review.routes.js";
import countryRoutes from "../modules/country/country.routes.js";
import adminRoutes from "../modules/admin/admin.routes.js";
import dashboardRoutes from "../modules/dashboard/dashboard.routes.js";



//https://back-go.vercel.app/

export const initApp = (app, express) => {
  app.use((req, res, next) => {
    if (req.originalUrl == '/rents/webhook') {
      next()
    } else {
      express.json({})(req, res, next)
    }
  })

  app.get("/", (req, res, next) => {
    res.status(200).json({ message: "welcome on our webApp" })
  })

  app.use("/users", userRoutes);
  app.use("/owners", ownerRoutes);
  app.use("/properties", propertyRoutes);
  app.use("/categories", categoryRoutes);
  app.use("/subCategories", subCategoryRoutes);
  app.use("/rents", rentRoutes);
  app.use("/reviews", reviewRoutes);
  app.use("/country", countryRoutes);
  app.use("/admins", adminRoutes);
  app.use("/dashboards", dashboardRoutes);


  app.all("*", (req, res, next) => {
    next(new AppError(`inValid path ${req.originalUrl}`, 404));
  });

  app.use(globalErrorHandel);

  dbConnection();
  app.listen(port, () => console.log(`Example app listening on port ${port}!`));
};

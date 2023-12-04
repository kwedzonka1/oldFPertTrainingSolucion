import { expect } from "@playwright/test";
import { ProjectPage } from "../Pages/project.page";
import { AdminUser, TestUser, NormalUser } from "../../LoginData";
import { test } from "../../globalFixtures";

test.use({
  storageState: `${AdminUser.storage}.json`,
});

test.describe("Project tests", async () => {
  let projectPage: ProjectPage;

  test.beforeEach(async ({ page }) => {
    projectPage = new ProjectPage(page);
  });

  test("successful creating project", async ({}) => {
    const expectedHeaderTitle = "Project list";
    await expect(projectPage.testHeader).toHaveText(expectedHeaderTitle);
  });
});

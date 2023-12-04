import { Page } from "@playwright/test";

export class ProjectPage {
  constructor(private page: Page) {}
  //Locators
  testHeader = this.page.locator("//div[contains(@class, 'project-list')]");
  //Methods
}

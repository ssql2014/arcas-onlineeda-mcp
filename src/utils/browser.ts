import puppeteer, { Browser, Page } from 'puppeteer';
import { logger } from './logger.js';
import { SessionState } from '../types/index.js';

export class BrowserManager {
  private state: SessionState = {
    isLoggedIn: false,
  };

  async initialize(): Promise<void> {
    try {
      logger.info('Launching browser for OnlineEDA...');
      this.state.browser = await puppeteer.launch({
        headless: process.env.ONLINEEDA_HEADLESS !== 'false',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      
      this.state.page = await this.state.browser.newPage();
      await this.state.page.setViewport({ width: 1920, height: 1080 });
      
      logger.info('Browser initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize browser', error);
      throw error;
    }
  }

  async navigateToOnlineEDA(): Promise<void> {
    if (!this.state.page) {
      throw new Error('Browser not initialized');
    }

    try {
      logger.info('Navigating to OnlineEDA platform...');
      await this.state.page.goto('https://onlineeda.arcas-da.com/', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      
      // Wait for the page to load
      await this.state.page.waitForTimeout(2000);
      
      logger.info('Successfully navigated to OnlineEDA');
    } catch (error) {
      logger.error('Failed to navigate to OnlineEDA', error);
      throw error;
    }
  }

  async login(username?: string, password?: string): Promise<boolean> {
    if (!this.state.page) {
      throw new Error('Browser not initialized');
    }

    try {
      // Check if already logged in
      const loggedIn = await this.checkLoginStatus();
      if (loggedIn) {
        this.state.isLoggedIn = true;
        return true;
      }

      // If credentials not provided, check environment variables
      const user = username || process.env.ONLINEEDA_USERNAME;
      const pass = password || process.env.ONLINEEDA_PASSWORD;

      if (!user || !pass) {
        logger.warn('No credentials provided for OnlineEDA login');
        return false;
      }

      // Attempt login (adjust selectors based on actual page structure)
      logger.info('Attempting to login to OnlineEDA...');
      
      // Look for login form
      await this.state.page.waitForSelector('input[type="text"], input[type="email"]', { timeout: 5000 });
      await this.state.page.type('input[type="text"], input[type="email"]', user);
      await this.state.page.type('input[type="password"]', pass);
      
      // Submit login
      await Promise.all([
        this.state.page.click('button[type="submit"]'),
        this.state.page.waitForNavigation({ waitUntil: 'networkidle2' }),
      ]);

      this.state.isLoggedIn = await this.checkLoginStatus();
      return this.state.isLoggedIn;
    } catch (error) {
      logger.error('Login failed', error);
      return false;
    }
  }

  async checkLoginStatus(): Promise<boolean> {
    if (!this.state.page) {
      return false;
    }

    try {
      // Check for indicators of logged-in state
      // This needs to be adjusted based on actual OnlineEDA UI
      const dashboardElement = await this.state.page.$('.dashboard, .project-list, .user-menu');
      return dashboardElement !== null;
    } catch (error) {
      return false;
    }
  }

  async takeScreenshot(filename?: string): Promise<string> {
    if (!this.state.page) {
      throw new Error('Browser not initialized');
    }

    const path = filename || `onlineeda-screenshot-${Date.now()}.png`;
    await this.state.page.screenshot({ path, fullPage: true });
    return path;
  }

  async close(): Promise<void> {
    if (this.state.browser) {
      await this.state.browser.close();
      this.state.browser = undefined;
      this.state.page = undefined;
      this.state.isLoggedIn = false;
    }
  }

  getPage(): Page | undefined {
    return this.state.page;
  }

  isLoggedIn(): boolean {
    return this.state.isLoggedIn;
  }
}
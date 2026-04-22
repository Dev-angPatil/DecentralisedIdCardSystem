const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:8000/login.html');
  
  // Create user first if not exists
  await page.evaluate(() => {
    const users = JSON.parse(localStorage.getItem('chainCampusUsers') || '[]');
    if(!users.find(u => u.email === 'devang.1251070841@vit.edu')) {
      users.push({
        email: 'devang.1251070841@vit.edu',
        password: 'Shinigami()09',
        name: 'Devang',
        studentId: 'CC-1234',
        college: 'VIT',
        program: 'B.Tech',
        year: '3rd'
      });
      localStorage.setItem('chainCampusUsers', JSON.stringify(users));
    }
  });

  await page.goto('http://localhost:8000/login.html');
  console.log("On login page");

  await page.type('input[name="email"]', 'devang.1251070841@vit.edu');
  await page.type('input[name="password"]', 'Shinigami()09');
  
  await page.click('button[type="submit"]');
  console.log("Clicked submit");

  await new Promise(r => setTimeout(r, 1000));
  
  // Check if step 2 is visible
  const step2Visible = await page.evaluate(() => {
    const step2 = document.querySelector('[data-step-2]');
    return step2 && !step2.classList.contains('step-hidden');
  });
  console.log("Step 2 visible:", step2Visible);

  if (step2Visible) {
    await page.click('[data-skip-wallet]');
    console.log("Clicked skip wallet");
    await new Promise(r => setTimeout(r, 2000));
    console.log("Current URL:", page.url());
  }

  await browser.close();
})();

let puppeteer = require("puppeteer");
let fs = require("fs");
let cFile = process.argv[2];
let userToAdd = process.argv[3];

(async function(){
    try{
        const browser = await puppeteer.launch(
            {
                headless :  false,
                slowMo : 50,
                defaultViewport: null,
                args: ["--incognito", "--start-maximized"]
    
            }
        );
        let pages = await browser.pages();
        let page = pages[0];

        let data = await fs.promises.readFile(cFile);    
        let {url, user, pwd} = JSON.parse(data);
    
        await page.goto(url , {waitUntil: "networkidle0"} );
        await page.type("#input-1",user);
        await page.type("#input-2",pwd);
    
        await page.click("button[data-analytics=LoginPassword]");
       
        
        // ********************DashBoard*************************
      await page.waitForNavigation( {waitUntil: "networkidle0"});
      await page.waitForSelector("a[data-analytics=NavBarProfileDropDown]", { visible: true });
      await page.click("a[data-analytics=NavBarProfileDropDown]");
      await page.click("a[data-analytics=NavBarProfileDropDownAdministration]");
    
      await page.waitForNavigation( {waitUntil: "networkidle0"});
      await waitForLoader(page);
      
      await page.waitForSelector(".administration header", { visible: true })
      let tabs = await page.$$(".administration header ul li a");
  
    let href = await page.evaluate(function (el) {
      return el.getAttribute("href");
    }, tabs[1])
    let managePageURL = "https://www.hackerrank.com" + href;
    // console.log("Line number number " + mpUrl);
    await page.goto(managePageURL, { waitUntil: "networkidle0" });
    
    // get question    
      let qidx = 0;
      while (true) {
        //  => qnumber => question
        let question = await getMeQuestion(page, qidx, managePageURL);
        if (question == null) {
          console.log("All Question processed");
          return;
        }
        await handleQuestion(page, question, userToAdd);
        qidx++;
      }

    }catch(err){
        console.log(err);
    }
   


})();

async function waitForLoader(page){
    await page.waitForSelector("#ajax-msg",{
        visible :  false
    });
}

async function getMeQuestion(page, qIdx, managePageURL){
    let pageIndx = Math.floor(qIdx/10);
    let queIdxOnPage = qIdx % 10;

    //pageVisit
    console.log(pageIndx + " "+ queIdxOnPage);
    //go to manage challenges page
    await page.goto(managePageURL);
    
    await waitForLoader(page);
   
    // you will wait for pagination 
    await page.waitForSelector(".pagination ul li", { visible: true });
    let paginations = await page.$$(".pagination ul li");

    let nextBtn = paginations[paginations.length - 2];

    let className = await page.evaluate(
        function(ele){
            return ele.getAttribute("class")
        },
        nextBtn

    )

//****** navigation over pages ************** */
    for(let i=0 ; i<pageIndx; i++){
       if(className == "disabled"){
           return null;
       }
       await  nextBtn.click();

       await page.waitForSelector(".pagination ul li", { visible: true });
       paginations = await page.$$(".pagination ul li");
       nextBtn = paginations[paginations.length - 2];
       className = await page.evaluate(
        function(ele){
            return ele.getAttribute("class")
        },
        nextBtn
        )
    
    }
//***************** question on page *************** */

    let challengesList = await page.$$(".backbone.block-center");
    
    if(challengesList.length >  queIdxOnPage){
        return challengesList[queIdxOnPage];
    }else{
        return null;
    }
    
    
}

async function handleQuestion(page, question, userToAdd) {
        // let qUrl = await page.evaluate(function (el) {
        //   return el.getAttribute("href");
        // }, question);
        
        // await page.goto(qUrl);
        question.click();
        
        await page.waitForNavigation( {waitUntil: "networkidle0"});
         await waitForLoader(page);
        //await Promise.all([page.waitForNavigation({ waitUntil: "networkidle0" }), question.click()]);
        await page.waitForSelector("li[data-tab=moderators]", { visible: true })
        await page.click("li[data-tab=moderators]");
        await page.waitForSelector("input[id=moderator]", { visible: true });
        await page.type("#moderator", userToAdd);
        await page.keyboard.press("Enter");
        await page.click(".save-challenge.btn.btn-green")
      }
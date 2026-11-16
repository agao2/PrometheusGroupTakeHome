Manual changes made outside of AI are called out in each entry's Notes. I pre-created some blank files ahead of time to guide AI better. 

---

**Prompt:**
```text
I just created a server directory, go in there and scaffold a skeleton fastify server in typescript with just a /health route that returns 200
```
**Notes:** Just initial setup of the backend, adding a health route so I can quickly test it is running

---

**Prompt:**
```text
Within the server directory, I create yahooClient.ts - I want you to create class that can make an http get call to https://query1.finance.yahoo.com/v8/finance/chart/TSLA
Use native fetch, make the function getPriceBars and it should take an optional interval param (default to 15m)
```
**Notes:**
- This created the main http client for calling yahoo, I only specified making the interval a param in my propmpt and it of course hard coded TSLA
- So I had to clean that up and make the symbol a param too. It response type didn't match yahoo's response exactly, so I had to prompt it to make a request and make the response shape match.
- Manually removed the error check it was throwing on non 200
- Manually removed values from Interval type since the requirements asked for intra day. I removed anything >= 1 day

---

**Prompt:**
```text
Create 2 errors - SymbolNotFoundError and UpstreamError
Map 404 to SymbolNotFoundError, and anything else non 2xx to UpstreamError
```

---

**Prompt:**
```text
Make sure repsonse is logged on error and add a 10 second timeout on api call
```

---

**Prompt:**
```text
Lets make some unit tests for error mapping based on status codes and an array is returned on 200. Make it right next to the original class that is being tested - yahooClient.test.ts
```

---

**Prompt:**
```text
Ok so I created a chartService.ts file - create a class that will call yahooClient
I want a function called getDailySummaries, and it should return a shape like:
[
   {
      "day":"2009-01-30",
      "lowAverage":40.2958,
      "highAverage":49.7534,
      "volume":49073348
   }
]
Don't worry about computing the averages using the data returned based on intervals right now.
Just make the class and methods and wire up the call, hard code the response on function if you need to
```
**Notes:** I like making my AI take small steps, so my brain can slowly review and iterate in chunks. Here I just want everything set up, and then we can work on the math in the next iteration.

---

**Prompt:**
```text
Update chart service and yahoo client to support a range, default this to 1 month (1mo)
```
**Note:** 
- Realized that I need a range to get data for more than 1 day - since I'll be grouping by days
- Doing some testing and also realized that Yahoo limits how small an interval can be depending on range. So I'm limiting the number of possible values for interval and range in the predefined type at least

---

**Prompt:**
```text
So yahooClient returns an array of pricebars, I need you to
1. Group all the price bars by day (array of array where array[i] returns all the price bars for a paritcular day)
2. Then go through and collapse that array of arrays into a single array. Collapse by computing the average for low and high, and just summing the volume. So array[i] becomes a single object, where the original array it returns gets collapsed.
3. Return this as the response of getDailySummaries
```
**Note:** 
- Outlining a strat for AI to execute given the requirements
- Manually added a function to round to 4 decimal places

---

**Prompt:**
```text
Need unit tests on the math
1. Happy path, 2 days worth of data and 15 minute interval. Make sure data is out of order. Assert that the averages and volume for each day is computed correctly.
2. Verify that an error thrown in getPriceBars is just passed threw (not caught)
3. Assert that the client returning [] results in getDailySummaries also returning []
```

---

**Prompt:**
```text
Lets create the endpoint in app.ts that will utitilize getDailySummaries
1. Add an endpoint GET /api/stocks/:symbol/daily
2. Validation added for symbol - it must exist and not be more than 15 characters
3. Add error handlers that map SymbolNotFoundError to 404 and the other one to 502
```
**Notes:**
- just exposing everything via the endpoint
- manually re-worded some of the error messages to my liking

---

**Promt:**
```text
Need some integration tests now for this new endpoint, add app.test.ts
1. Succesful 200 and gets back array
2. 404 - symbol does not exist
3. call endpoint with no symbol or over 15 characters
4. Make it throw an upstream error and verify it returns 502
```

---

**Prompt:**
```text
Create app.integration.test.ts but make real api calls to yahoo. This is an integration test. Split the test commands so unit and integration tests can be ran separately
```

---

**Prompt:**
```text
The 16:00 closing day should be excluded from average calculation as the volume is 0, lets unit test this scenario as well
```
**Note:** Manually deleting and cleaning up some of the comments that ai leaves, they read like a scientific paper

---

**Prompt:**
```text
Ok time to move on to the frontend. I scaffolded a react app via vite under /client. Lets add the wiring to make api calls to backend
1. create src/api/stock.ts - this needs to make an api call to the backend, function can be fetchDailySummaries and it should take a symbol
2. create src/hooks/useDailySummaries - this should be a hook to manage state and the data coming back from api call, use tanstack here
```
**Notes:**
- Made some changes to not read the body at all on non 2xx, we show error messages based on status code
- Made retry function on hook easier to read, and lowered number of retries to just one
- Follow up prompt to map status codes to error messages in hook, 404 -> Invalid symbol and anything else as failed request

---

**Prompt:**
```text
Lets create some components used to query our api and render data
1. client/src/components/SymbolForm.tx
2. Needs to have an input and search button. On submit will make api call using the useDailySummaries hook
```
**Notes:**
- had to do a follow up prompt to get rid of depreciated form event type
- forced SymbolForm to use the hook instead of drilling down props from app.tsx
- added some css here, I'm not a big ux expert but needed some spacing between buttons and inputs and label

---

**Prompt:**
```text
what is useIsFetchingDailySummaries
```
**Notes:**
- Questioned why the AI added a 2nd hook just for the Search button's loading state when useDailySummaries already has isFetching
- AI justified it with "useDailySummaries(input) would fetch on every keystroke"
- but we only search if someone "clicks" the search button

---

**Prompt:**
```text
So nothing in the code does that right now - as in fetch on every keystroke. You invented a problem we dont have and used that as reasoning for the extra useIsFetchingDailySummaries hook. Lets remove that and just use isFetching from useDailySummaries
```

---

**Prompt:**
```text
Lets add SummaryChart.tx that uses recharts to show a simple line graph of the 3 values we get back
The day will just be the x axis. And we can toggle between low average, high average, and volume for each day
```

---

**Prompt:**
```text
Lets make the button the same size regardless of whether the message is "search" or "searching". Also is there any styling and css classes we can clean up? I manually deleted a lot of components that came with the scaffolding? If so please do it
```

---

**Prompt:**
```text
Each time I hit search, it should reset the data. So If I enter TLSA and then ZZZ - we should get rid of the chart and show an error message for invalid symbol. Also on empty array, we should show an error message on no data.
```

---

**Prompt:**
```text
Need some unit test on these react components - follow same pattern as backend with a test file right next to the original file
1. SymbolForm - search button is disabled when empty, enter calls submit, submit trims spaces and casts to upper case
2. in useDailySummaries - unit tests for toErrorMessage for the different cases
3. SummaryChart - renders with empty array and with data and 404 response
```
# Charts Application
Javascript web application developed by [Azarattum](https://github.com/Azarattum) for Telegram's "Chart Coding Competition". It supports line charts with 1 or 2 Y axes, bar charts and percentage stacked area charts. This is a webgl version for "Stage 2". The original one can be found [here](https://github.com/Azarattum/ChartsApp).

## Features:
  - Incredible performance thanks to webgl
  - Attention to details (such and '%' on percentage Y axis)
  - Everything is carefully animated
  - Support iOS web app
  - All chart related things are wrapped into class ChartElement. So, it can be easily used multiple times on multiple pages
  - ChartElement is fully customizable. You can change colors, fonts, margins without modifying the actual source code
  - ChartElement can automatically adapt for rescaled resolution using update function
  - Animtions' speeds are easily customizable
  - Hold to uncheck other graphs
  - Nice loading screen
  - Y axis from minimum value
  - Tooltips showing graph values and percentage (for certain charts)

## Technical Features:
  - EVERYTHING was written from scratch, no libraries were used
  - Nice webgl wrapper with custom shader preprocessor
  - All charts are drawn using webgl
  - All charts' points are processed only while the initial loading
  - Chart's data sends to shaders only once. Further manipulation are done using transformation matrix and other uniforms
  - Vertices are draw only in user's view
  - Calculations are performed only in user's view
  - Only one iteration through visible points to find: start, end, maximum and selection
  - Chart redraws only when modified
  - Render is bind to requestAnimationFrame
  - All shaders' and charts' sources are loaded via AJAX
  - Code was written using ES6 with OOP structure
  - Most of functions have documentation
  - Hard parts of code are carefully commented
  - Theme changing was done using pure CSS (except charts' backgrounds)
  

### Examples:
Easy to create new chart:
```javascript
var chartElement = new ChartElement(container, shaders);
```
where 
  - container - DOM element container for a new chart
  - shaders - Object that contains shader source, like: {line: [], bar: [], area: [], layout: []}. Sources can be loaded however you want.

Now, set the data:
```javascript
chartElement.chart = data;
```
where 
  - data - JSON parsed object with provided format

Then add some styles:
```javascript
chartElement.style = {
    background: "#FFF",
    text: "#000",
    font: "inherit",
    lowlight: 0.1,
    border: "1px",
    margin: "8px",
    dates: "24px",
    preview: "48px",
    select: "48px"
};
```
ChartElement can be configurated deeper via accessing sub classes such as ChartDrawer, GraphDrawer, LayoutDrawer, SelectionDrawer.

And the final touch, set the custom title to our chart:
```javascript
chartElement.title = "Title";
```

Now, we can render it:
```javascript
chartElement.render();
```

Also easily update after resizing:
```javascript
chartElement.update();
```

For more information look at the source code.

### Demo:
The working demo is available [here](http://cu.interkot.ru/azarattum/chartsgl).
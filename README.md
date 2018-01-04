# Magic-Visual-Regression
[![Build Status](https://travis-ci.org/Anenth/Magic-Visual-Regression.svg?branch=master)](https://travis-ci.org/Anenth/Magic-Visual-Regression) [coveralls badge]

A Simple tool for **Visual Regression**.

Its always hard to get things started, everyone thinks about getting started with 
visual regression testing on their website/apps but fails because of difficulty in gettings started,
 I was in a similar situation too. 

It's acually very easy to get started. 

    1. Take the screenshots.
    2. Compare the images.
    3. Check the difference.

In this tool, we will take care of the 2 and 3 steps,
the tool uses `resemble.js` to generate the diff images.

## Installation  
    
    `yarn add magic-visual-regression` or `npm i magic-visual-regression` 

## Usage
1. Take screenshots and give it a good name. These are the **reference** images.
    Screenshots can be captured using many techniques, Simplest to get started being taking
    screenshots manually, a handy chrome extension is [Full page screen capture](https://chrome.google.com/webstore/detail/full-page-screen-capture/fdpohaocaechififmbbbbbknoalclacl "Full page screen capture"). 
2. After making changes to your code(css). Take the screenshots of **test** images which 
    will be compared with the reference images.
3. Now it's time for magic run 
    `magic-visual-regression <path to reference images> <path to test images> <path to save diff images>`.

## Tests
    Pending

<!--## Contributing 
    -->









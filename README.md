## About
Hi, I’m a keyboard enthusiast and currently daily driving the **boardsource unicorne**. 

Out of the box an excellent keyboard however, the slave board’s LCD, by default, displays the “lulu” and boardsource logo (boring). After all, what’s the point of a _custom_ keyboard if I can’t customize every part of it?

The unicorne runs on **QMK firmware**, so I started experimenting. Compiling QMK was straightforward, and replacing the displayed image was even simpler. Just create an 128x32 monochrome bitmap image and with a tool like [LCD Assistant](https://projedefteri.com/en/tools/lcd-assistant/) you can generate code that can be dropped straight into the firmware.

But I wanted something more robust, I wanted a way to change the display dynamically. Specifically, I wanted a **drawing tool** that could live-update the LCD with each brush stroke.

This project is that solution: custom firmware + frontend + backend stack that lets me or anyone edit and stream images to my keyboard’s LCD in real time.

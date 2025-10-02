# About
Hi, I’m a keyboard enthusiast and currently daily driving the **boardsource unicorne**. 

An excellent keyboard however, the default display on the slave board’s LCD is really boring. After all, what’s the point of a _custom_ keyboard if I can’t customize every part of it?

The unicorne runs on **QMK**, an open source firmware centered around computer input devices. Compiling QMK was straightforward, and replacing the displayed image was even simpler. Tools like [LCD Assistant](https://projedefteri.com/en/tools/lcd-assistant/) already exist which allow you to generate code from a source image that can be dropped straight into the firmware.

But I wanted something more robust, I wanted a way to change the display dynamically, without having to recompile. Specifically, I needed a **drawing tool** that could live-update the LCD with each brush stroke.

This project solves that need: custom firmware + frontend + backend stack that lets me or anyone edit and stream images to my keyboard’s LCD in real time.

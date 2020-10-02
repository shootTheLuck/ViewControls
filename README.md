# View-Controls

Camera controls for THREE.js based on the view controls of a popular online MMO. Use <kbd>Alt</kbd> and/or <kbd>Ctrl</kbd> keys to position and rotate a perspective camera.  Use <kbd>Esc</kbd> key to return camera to where it started.

Demo with instructions is [here.](https://shoottheluck.github.io/View-Controls)

## How do I use it?
```javascript
// import
import {ViewControls} from "./ViewControls.js";

// create instance with these three arguments
var viewControls = new ViewControls( camera, scene, renderer.domElement );

// update once per frame in your render loop:
viewControls.update()
```

Upon running your scene, if you hold the <kbd>Alt</kbd> key down and click (and hold) your mouse on an object, <br>
The camera should pan toward that object automatically. After that, moving the mouse left or right  <br>
orbits around the object.  Moving the mouse up and down dollies the camera closer and farther away <br>

Holding the <kbd>Alt</kbd>+<kbd>Ctrl</kbd> keys simultaneously changes the mouse up and down behavior to <br>
orbit over or under the object.  Mouse left and right remain as before. <br>

Pressing the <kbd>Esc</kbd> key returns the camera to its original position and rotation.

***\*\*\*Important Note\*\*\****

On at least some operating systems (Lubuntu for instance), using the <kbd>Alt</kbd> key with mouse drag<br>
is reserved for moving windows across the screen.

This can be disabled system-wide (in Lubuntu at least) by editing ~/.config/openbox/lubuntu-rc.xml <br>
and commenting-out items under the line \<context name="Frame"\> that begin with \<mousebind button="A... <br>

Alternatively, pass a string for an alternate "alt" key such as "OS" (for the "windows" key) <br>
to ViewControls as an option and use that instead of <kbd>Alt</kbd>:

```javascript
controls = new ViewControls( camera, scene, renderer.domElement, { altKey: "OS" } );
```
See https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/getModifierState for suitable values.

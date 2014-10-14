# About the project

This is an AngularJs wrapper for the Ziggeo video service. It can make your life less miserable. I made this during the HackTheNorth 2014.

## Getting Started

You need to first include the Ziggeo Javascript and Css files. You will also need to include your
api key.

``` html

<link rel="stylesheet" href="//assets.ziggeo.com/css/ziggeo-betajs-player.min.css" />
<script src="//assets.ziggeo.com/js/ziggeo-jquery-json2-betajs-player.min.js"></script>
<script>ZiggeoApi.token = "YOUR_API_KEY";</script>

```

*Note:* Ziggeo might update their API in the future so it is better to use the latest js and css files
posted in their [official docs](https://ssl.ziggeo.com/docs).

```
bower install angular-ziggeo
```

Then include the angular-ziggeo.min.js or angular-ziggeo.js for debugging purposes.

## Using the ziggeo-angular directive

It is really simple to use the the ziggeo-angular directive. ziggeo-angular can do everything that
 the JavaScript API does.

 ``` html
 <ziggeo-angular options="options"></ziggeo-angular>
 ```
 Here is a complete outline of all supported parameters:

 - width (int): Width of the embedding
 - height (int): Height of the embedding
 - responsive (bool): Embedding maximizes to the size of the bounding box
 - popup_width (int): Width of the popup
 - popup_height (int): Height of the popup
 - popup (bool): Popup the player after clicking on play
 - video (string): Video token or key
 - stream (string): Stream token or key
 - modes (array): Allowed modes for embedding (specify them as comma-separated list in the embedding or as an array when calling JavaScript commands):
 1. recorder: Allows the embedding to be used as recorder
 2. player: Allows the embedding to be used as player
 3. rerecorder: Allows the embedding to be used as rerecorder
 - tags (array): Tags that a newly created video should be associated with
 - perms (array): Video permissions	— Allow options are (specify them as comma-separated list in the embedding or as an array when calling JavaScript commands):
 - allowupload: Enable uploading of custom user videos
 - forbidrecord: Disable recording using the user's webcam
 - forbidswitch: Disable switching between uploading and recording
 - forbidrerecord: Disable rerecording
 - disable_first_screen (bool): Disable the initial screen of the recorder
 - disable_device_test (bool): Disable testing microphone and camera before recording the user
 - disable_timer (bool): Disable showing the recording time to the user
 - key (string): Key that a newly created video should be associated with
 - limit (int): Maximum duration of video
 - countdown (int): Countdown before recording starts (default is 5 seconds, minimum is 3 seconds)
 - input_bind (string): Bind video token to form input field by given name
 - form_accept (string): Only allow form submission (jquery selector) if video has been recorded
 - id (string): Id of embedding to look it up
 - client_auth (string): Client-Side Authorization Token
 - rerecordings (int): Limit the number of rerecordings

  You just have to set the options object according to your desired settings.

  ``` Javascript
  $scope.options = {
    width: 230
  }
  ```

  ## Services

  angular-ziggoe contains the following services:

  1. $ZiggeoEvents: [[read more]](https://ssl.ziggeo.com/reference#client-events)
  2. $ZiggeoStreams: [[read more]](https://ssl.ziggeo.com/reference#client-methods-streams)
  3. $ZiggeoVideos: [[read more]](https://ssl.ziggeo.com/reference#client-methods-videos)
  4. $ZiggeoStyles: [[read more]](https://ssl.ziggeo.com/docs#client-customization)

  ## Contributions

  Please contribute to the repo to help make it better.
  
  ## License
  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated       documentation files (the "Software"), to deal in the Software without restriction, including without limitation the  rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

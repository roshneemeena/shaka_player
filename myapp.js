var manifestUri =
    'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd';
var licenseServer = 'https://cwip-shaka-proxy.appspot.com/header_auth';

    

function initApp() {
   shaka.log.setLevel(shaka.log.Level.DEBUG);
  // Install built-in polyfills to patch browser incompatibilities.
  shaka.polyfill.installAll();
  


  // Check to see if the browser supports the basic APIs Shaka needs.
  if (shaka.Player.isBrowserSupported()) {
   
    initPlayer();
  } else {
    // This browser does not have the minimum set of APIs we need.
    console.error('Browser not supported!');
  }
   updateOnlineStatus();
  window.addEventListener('online',  updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

}

function initPlayer() {
  
  var video = document.getElementById('video');
  var player = new shaka.Player(video);

  window.player = player;

  
  
  player.addEventListener('error', onErrorEvent);
  player.load(manifestUri).then(function() {
    // This runs if the asynchronous load is successful.
    console.log('video is loaded',manifestUri);
  }).catch(onError);
  initStorage(player);
  console.log('**VIDEO_LOADS**',manifestUri)
  var downloadButton = document.getElementById('download-button');
  downloadButton.onclick = onDownloadClick;

  // Update the content list to show what items we initially have
  // stored offline.
  refreshContentList();
}

function onErrorEvent(event) {
  // Extract the shaka.util.Error object from the event.
  onError(event.detail);
}

function onError(error) {
  // Log the error.
  console.error('Error code', error.code, 'object', error);
}

/**
 * 
 * @param {type} tracks
 * @returns {Array}
 * This function is to select the highest bandwidth track
 */

function selectTracks(tracks) {
 
  var found = tracks
      .filter(function(track) { return track.type == 'variant'; })
      .sort(function(a, b) { return a.bandwidth > b.bandwidth; })
      .pop();
  console.log('Offline Track: ' + found);
  return [ found ];
}
/**
 * 
 * @param {type} player
 * @returns {undefined}
 * This function to initialize the storage
 */
function initStorage(player) {
  
  window.storage = new shaka.offline.Storage(player);
  window.storage.configure({
    progressCallback: setDownloadProgress,
    trackSelectionCallback: selectTracks
  });
}
/**
 * 
 * @returns {!Promise.<!Array.<shaka.extern.StoredContent>>}
 * This function is to return all the downloaded contents
 */
function listContent() {
  return window.storage.list();
}
/**
 * 
 * @param {type} content
 * @returns {undefined}
 * This function is to play the offline content
 */
function playContent(content) {
  window.player.load(content.offlineUri);
  console.log('**VoD(Video On Demand) is played**')
}

/**
 * 
 * @param {type} content
 * @returns {Promise|this.constructor|nm$_crc32-stream.module.exports.prototype.then.prom|Object.prototype.then.prom|nm$_index.Command.prototype.then.prom|!Promise.<T>|!Promise}
 * This function is to remove the content from  the storage
 */
function removeContent(content) {
  return window.storage.remove(content.offlineUri);
  
}
/**
 *
 * @param {type} manifestUri
 * @param {type} title
 * @returns {!Promise.<shaka.extern.StoredContent>|Promise|this.constructor|nm$_crc32-stream.module.exports.prototype.then.prom|Object.prototype.then.prom|nm$_index.Command.prototype.then.prom|!Promise.<T>}
 * This function is to save the content with storage
 */

function downloadContent(manifestUri, title) {
  
  var metadata = {
    'title': title,
    'downloaded': Date(),
    
   
  };
  
  console.log(metadata)
  return window.storage.store(manifestUri, metadata);
}

/**
 * 
 * @returns {undefined}
 * When the download button is clicked the download starts. This function disables the
 * download button until the download completes
 * 
 */
function onDownloadClick() {
  var downloadButton = document.getElementById('download-button');
  var manifestUri = document.getElementById('asset-uri-input').value;
  var title = document.getElementById('asset-title-input').value;

  
  downloadButton.disabled = true;

  setDownloadProgress(null, 0);

  downloadContent(manifestUri, title)
    .then(function() {
      return refreshContentList();
    })
    .then(function(content) {
      setDownloadProgress(null, 1);
      downloadButton.disabled = false;
    })
    .catch(function(error) {
      
      downloadButton.disabled = false;
      onError(error);
    });
}

/*
 * Update the online status box at the top of the page to tell the
 * user whether or not they have an internet connection.
 */
function updateOnlineStatus() {
  var signal = document.getElementById('online-signal');
  if (navigator.onLine) {
    signal.innerHTML = 'ONLINE';
    signal.style.background = 'green';
  } else {
    signal.innerHTML = 'OFFLINE';
    signal.style.background = 'grey';
  }
}

/**
 * 
 * @param {type} content
 * @param {type} progress
 * @returns {undefined}
 * This function is to show the progress during download
 */

function setDownloadProgress(content, progress) {
  var progressBar = document.getElementById('progress-bar');
  progressBar.value = progress * progressBar.max;
}
/**
 * 
 * @returns {unresolved}
 * clear the table and repopulate with the current list of downloaded content
 */
function refreshContentList() {
  var contentTable = document.getElementById('content-table');

  
  while (contentTable.rows.length) {
    contentTable.deleteRow(0);
    console.log('**Video Unloaded**');
  }

  var addRow = function(content) {
    var append = -1;

    var row = contentTable.insertRow(append);
    row.insertCell(append).innerHTML = content.offlineUri;
    Object.keys(content.appMetadata)
        .map(function(key) {
          return content.appMetadata[key];
        })
        .forEach(function(value) {
          row.insertCell(append).innerHTML = value;
        });

    row.insertCell(append).appendChild(createButton(
        'PLAY',
        function() { playContent(content); }));

    row.insertCell(append).appendChild(createButton(
        'REMOVE',
        function() {
          removeContent(content)
              .then(function() { refreshContentList() });
        }));
  };

  return listContent()
      .then(function(content) { content.forEach(addRow); });
};

function createButton(text, action) {
  var button = document.createElement('button');
  button.innerHTML = text;
  button.onclick = action;
  return button;
}

document.addEventListener('DOMContentLoaded', initApp);


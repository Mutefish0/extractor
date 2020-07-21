import React, { useState, useEffect } from 'react';
import { getClipboardText, saveVideoToPhotosAlbum } from './wxbridge';

import './App.css';


// interface VideoInfo {
//   id: string;
//   url: string;
//   contentType: string;
//   poster: string;
// }

function App() {
  const [videoInfo, setVideoInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  function tryExtractAndDisplay() {
    getClipboardText().then((twitterURL) => {
      const match = /https:\/\/twitter\.com\/[^/]+\/status\/\d+\/?/.exec(twitterURL);
      if (match) {
        setLoading(true);
        fetch(`/api/extract/twitter?url=${encodeURIComponent(twitterURL)}`)
          .then((resp) => resp.json())
          .then((info) => {
            setLoading(false);
            setVideoInfo(info);
          })
          .catch((e) => alert(e.message));
      }
    });
  }
  return (
    <div>
      <button onClick={tryExtractAndDisplay}>提取</button>
      {loading && <p>提取中...</p>}
      {videoInfo && !videoInfo.failed && (
        <video width="320" height="240" preload="metadata" webkit-playsinline controls poster={videoInfo.poster}>
          <source src={videoInfo.url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
      {videoInfo && !videoInfo.failed && <button onClick={() => saveVideoToPhotosAlbum(videoInfo.url, videoInfo.id)}>保存视频到相册</button>}
      {videoInfo && videoInfo.failed && <div>提取失败！</div>}
    </div>
  );
}

export default App;

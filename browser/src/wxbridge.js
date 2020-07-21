let __miniprogram_tunnel_message__cbs = {};
const isInMiniProgram = window.__wxjs_environment === 'miniprogram';

window.onstorage = (e) => {
  const matchKey = /__miniprogram_tunnel_message__r([0-9]+)/.exec(e.key);
  if (matchKey) {
    if (e.newValue) {
      try {
        const obj = JSON.parse(e.newValue);
        const cb = __miniprogram_tunnel_message__cbs[matchKey[1]];
        if (cb) {
          delete __miniprogram_tunnel_message__cbs[obj.msgId];
          if (obj.success) {
            cb(null, obj.data);
          } else {
            cb(new Error(obj.message));
          }
        }
      } catch (err) {
        console.error('web-view parse message error: ', err.message);
      }
    }
  }
};

function callMiniprogramService(name, data) {
  return new Promise((resolve, reject) => {
    const msgId = ('' + Math.random()).slice(2);
    __miniprogram_tunnel_message__cbs[msgId] = (err, data) => {
      if (!err) {
        resolve(data);
      } else {
        reject(err);
      }
    };
    localStorage.setItem(
      `__miniprogram_tunnel_message__s${msgId}`,
      JSON.stringify({ type: name, data })
    );
  });
}

export function getClipboardText() {
  if (isInMiniProgram) {
    return callMiniprogramService('getClipboardText');
  } else {
    return Promise.resolve(window.prompt('请输入URL', ''));
  }
}

export function saveVideoToPhotosAlbum(url, fileName) {
  return callMiniprogramService('saveVideoToPhotosAlbum', { url, fileName });
}
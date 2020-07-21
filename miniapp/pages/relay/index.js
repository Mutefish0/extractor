const app = getApp();

let version = 1;
function genRelayUrl(msgId, msg) {
  if (msgId) {
    return `${app.globalData.env.origin}/msg-relay.html?v=${version++}&__miniprogram_tunnel_message__r${msgId}=${msg}`
  }
  return `${app.globalData.env.origin}/msg-relay.html?v=${version++}`;
}

Page({
  data: {
    src: '',
    origin: app.globalData.env.origin,
  },

  bindWebviewError(e) {
    console.log('relay web-view error: ');
    console.log(e);
  },

  bindWebviewLoad(e) {
    const match = /__miniprogram_tunnel_message__s(\d+)\=(.*)/.exec(e.detail.src);
    if (match) {
      const msgId = match[1];
      let obj;
      try {
        obj = JSON.parse(decodeURIComponent(match[2]));
      } catch (e) {
        console.error('tunnel message parse error');
      }

      switch (obj.type) {
        case 'echo':
          this.reply(msgId, { success: true, data: obj.data, msgId: obj.msgId });
          break;
        case 'getClipboardText':
          wx.getClipboardData({
            success: (res) => this.reply(msgId, { success: true, data: res.data, msgId: obj.msgId })
          });
          break;
        case 'saveVideoToPhotosAlbum':
          const { url, fileName } = obj.data;
          wx.showLoading({
            title: '下载并保存到相册中...',
          });
          wx.downloadFile({
            url,
            filePath: wx.env.USER_DATA_PATH + '/' + fileName + '.mp4',
            success: res => {
              console.log(res);
              let filePath = res.filePath;
              wx.saveVideoToPhotosAlbum({
                filePath,
                success: file => {
                  wx.showToast({
                    title: '下载成功',
                    icon: 'success',
                    duration: 2000
                  })
                  let fileMgr = wx.getFileSystemManager();
                  fileMgr.unlink({
                    filePath: wx.env.USER_DATA_PATH + '/' + fileName + '.mp4',
                    success: function (r) {

                    },
                  })
                  wx.hideLoading();
                  this.reply(msgId, { success: true, data: null, msgId: obj.msgId });
                },
                fail: err => {
                  console.log(err)
                  if (err.errMsg === 'saveVideoToPhotosAlbum:fail auth deny') {
                    wx.showModal({
                      title: '提示',
                      content: '需要您授权保存相册',
                      showCancel: false,
                      success: data => {
                        wx.openSetting({
                          success(settingdata) {
                            if (settingdata.authSetting['scope.writePhotosAlbum']) {
                              wx.showModal({
                                title: '提示',
                                content: '获取权限成功,再次点击下载即可保存',
                                showCancel: false,
                              })
                            } else {
                              wx.showModal({
                                title: '提示',
                                content: '获取权限失败，将无法保存到相册哦~',
                                showCancel: false,
                              })
                            }
                          },
                        })
                      }
                    })
                  }
                }
              })
            }
          })
      }
    }
  },

  reply(msgId, data) {
    this.setData({ src: genRelayUrl(msgId, encodeURIComponent(JSON.stringify(data))) });
  },

  onLoad() {
    wx.hideTabBar();
    this.setData({ src: genRelayUrl() });
    wx.switchTab({ url: '/pages/index/index' });
  }
});
exports.parse = (text) => {
  var iso = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)(Z)?/;
  var ms = /(Date\()(\d+)(\))/;
  return JSON.parse(text, (key, value) => {
    // 处理日期类型
    if (typeof value === 'string' && value.length >= 10 && value.length <= 24) {
      // ISO格式
      var a = iso.exec(value);
      if (a) return !a[7] ? new Date(+a[1], +a[2] - 1, +a[3], +a[4], +a[5], +a[6]) : new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4], +a[5], +a[6]));
      // 微软格式
      a = ms.exec(value);
      if (a) return new Date(a[2]);
    }
    return value;
  });
};

exports.stringify = JSON.stringify;
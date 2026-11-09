// CloudFront Function (runtime cloudfront-js-2.0), attached to the distribution's
// default behaviour on the viewer-request event.
//
//   www.carpetempus.co.uk/*  ->  301 to the canonical host
//   /about/index.html        ->  301 to /about/
//   /about                   ->  301 to /about/ (query string kept)
//   /about/                  ->  served from /about/index.html
//   /_astro/site.css         ->  unchanged (anything with a file extension)
//   //evil.example/x         ->  301 to /evil.example/x/ (redirects never leave this site)
//
// CANONICAL_HOST must match site.url in src/config/site.ts; a unit test enforces this.
var CANONICAL_HOST = "carpetempus.co.uk"
var REDIRECT_HOSTS = ["www.carpetempus.co.uk"]

function querySuffix(querystring) {
  var parts = []
  for (var name in querystring) {
    var param = querystring[name]
    var values = param.multiValue ? param.multiValue : [param]
    for (var i = 0; i < values.length; i++) {
      parts.push(values[i].value === "" ? name : name + "=" + values[i].value)
    }
  }
  return parts.length > 0 ? "?" + parts.join("&") : ""
}

// Browsers read a Location of "//evil.example/" or "/\evil.example/" as another
// site, which would make every redirect below an open redirect. Drop control
// characters (browsers ignore them in URLs), then collapse leading slashes and
// backslashes into one slash.
function sameSitePath(path) {
  return (
    "/" + path.replace(/[\u0000-\u001f\u007f]/g, "").replace(/^[\/\\]+/, "")
  )
}

function redirect(location) {
  return {
    statusCode: 301,
    statusDescription: "Moved Permanently",
    headers: {
      location: { value: location },
      "cache-control": { value: "public, max-age=3600" },
    },
  }
}

function handler(event) {
  var request = event.request
  var host = request.headers.host
    ? request.headers.host.value.toLowerCase()
    : ""
  var uri = request.uri
  var query = querySuffix(request.querystring)

  if (REDIRECT_HOSTS.indexOf(host) !== -1) {
    return redirect("https://" + CANONICAL_HOST + sameSitePath(uri) + query)
  }
  if (uri.endsWith("/index.html")) {
    return redirect(sameSitePath(uri.slice(0, -"index.html".length)) + query)
  }
  if (uri.endsWith("/")) {
    request.uri = uri + "index.html"
    return request
  }
  var lastSegment = uri.slice(uri.lastIndexOf("/") + 1)
  if (lastSegment.indexOf(".") === -1) {
    return redirect(sameSitePath(uri) + "/" + query)
  }
  return request
}

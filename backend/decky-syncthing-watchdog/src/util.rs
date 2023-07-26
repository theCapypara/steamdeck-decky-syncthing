use hyper::body::HttpBody;
use hyper::client::HttpConnector;
use hyper::Client;
use hyper_tls::{native_tls, HttpsConnector};

pub fn make_unsafe_https_client<B>() -> Client<HttpsConnector<HttpConnector>, B>
where
    B: HttpBody + Send,
    B::Data: Send,
{
    let tls = tokio_native_tls::TlsConnector::from(
        native_tls::TlsConnector::builder()
            .danger_accept_invalid_certs(true)
            .build()
            .unwrap(),
    );
    let mut http = HttpConnector::new();
    http.enforce_http(false);
    let mut https = HttpsConnector::from((http, tls));
    https.https_only(false);
    Client::builder().build::<_, B>(https)
}

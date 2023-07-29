use hyper::body::HttpBody;
use hyper::client::HttpConnector;
use hyper::Client;
use hyper_rustls::HttpsConnector;
use rustls::client::{ServerCertVerified, ServerCertVerifier};
use rustls::{Certificate, ClientConfig, Error, ServerName};
use std::sync::Arc;
use std::time::SystemTime;

pub fn make_unsafe_https_client<B>() -> Client<HttpsConnector<HttpConnector>, B>
where
    B: HttpBody + Send,
    B::Data: Send,
{
    let https = hyper_rustls::HttpsConnectorBuilder::new()
        .with_tls_config(
            ClientConfig::builder()
                .with_safe_defaults()
                // We just accept any cert. Yes this is unsafe, but we only ever talk to the Syncthing on localhost.
                .with_custom_certificate_verifier(Arc::new(AcceptAnyCert))
                .with_no_client_auth(),
        )
        .https_or_http()
        .enable_http1()
        .build();
    Client::builder().build::<_, B>(https)
}

struct AcceptAnyCert;

impl ServerCertVerifier for AcceptAnyCert {
    fn verify_server_cert(
        &self,
        _end_entity: &Certificate,
        _intermediates: &[Certificate],
        _server_name: &ServerName,
        _scts: &mut dyn Iterator<Item = &[u8]>,
        _ocsp_response: &[u8],
        _now: SystemTime,
    ) -> Result<ServerCertVerified, Error> {
        Ok(ServerCertVerified::assertion())
    }
}

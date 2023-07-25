use warp::Filter;

#[tokio::main(flavor = "current_thread")]
async fn main() {
  let mut clients = Vec::with_capacity(2);
  let main_page = warp::path::end()
    .and(warp::get())
    .and(warp::fs::file("index.html"));

  let invitation_request = warp::path("INVITATION_REQUEST")
    .and(warp::post())
    .and(warp::body::bytes())
    .map(|body| {});

  let routes = main_page;

  warp::serve(routes).run(([127, 0, 0, 1], 3030)).await;
}

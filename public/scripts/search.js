$('#club-search').on('input', function() {
  var search = $(this).serialize();
  if(search === "search=") {
    search = "all"
  }
  $.get('/clubs?' + search, function(data) {
    $('#club-grid').html('');
    data.forEach(function(club) {
      $('#club-grid').append(`
        <div class="col-md-3 col-sm-6">
          <div class="thumbnail">
            <img src="${ club.image }">
            <div class="caption">
              <h4>${ club.name }</h4>
            </div>
            <p>
              <a href="/clubs/${ club._id }" class="btn btn-primary">More Info</a>
            </p>
          </div>
        </div>
      `);
    });
  });
});

$('#club-search').submit(function(event) {
  event.preventDefault();
});
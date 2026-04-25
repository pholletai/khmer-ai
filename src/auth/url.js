const url = `https://www.facebook.com/v19.0/dialog/oauth +
    ?client_id=${appId} +
    &redirect_uri=${encodeURIComponent(redirect)} +
    &scope=pages_show_list,pages_manage_metadata,pages_messaging;

  res.redirect(url);
});

module.exports = router`;

(function() {

	var requester_id;
	var requester_email;
	var has_twitter_profile;
	var API_KEY = "cfac754caac398e4";
	
	var contact_data = {
	  "status" : 200,
	  "requestId" : "3d8e7dc6-b14a-46cd-b67d-73b266fa358d",
	  "likelihood" : 0.9,
	  "photos" : [ {
	    "type" : "linkedin",
	    "typeId" : "linkedin",
	    "typeName" : "LinkedIn",
	    "url" : "https://d2ojpxxtu63wzl.cloudfront.net/static/bff4cd380f73014a61f98c8aaeb78f82_402ccd57bcf7e88d9b64e8940ae52988648ebf2575a8e5dfa3d74ea8222e883a",
	    "isPrimary" : true
	  }, {
	    "type" : "gravatar",
	    "typeId" : "gravatar",
	    "typeName" : "Gravatar",
	    "url" : "https://d2ojpxxtu63wzl.cloudfront.net/static/27981d95a244285cfdcb2975bf711fa9_aa019bdfe61117ad98f3098c0ee9b41a39c758876d8899b9a2e03906953e7f95",
	    "isPrimary" : false,
	    "photoBytesMD5" : "823770267aaa99e57ad4bfa8b9728afb"
	  } ],
	  "contactInfo" : {
	    "fullName" : "Ben Reyes"
	  },
	  "organizations" : [ {
	    "isPrimary" : true,
	    "name" : "Zendesk",
	    "startDate" : "2012-09",
	    "title" : "Entrepreneurial Hacker In Residence",
	    "current" : true
	  } ],
	  "demographics" : {
	    "locationGeneral" : "London, United Kingdom"
	  },
	  "socialProfiles" : [ {
	    "type" : "gravatar",
	    "typeId" : "gravatar",
	    "typeName" : "Gravatar",
	    "url" : "http://gravatar.com/zendeskben",
	    "username" : "zendeskben",
	    "id" : "40334673"
	  }, {
	    "bio" : "Founder and Consultant",
	    "type" : "linkedin",
	    "typeId" : "linkedin",
	    "typeName" : "LinkedIn",
	    "url" : "https://www.linkedin.com/in/benreyes"
	  }, {
	    "followers" : 0,
	    "following" : 0,
	    "type" : "facebook",
	    "typeId" : "facebook",
	    "typeName" : "Facebook",
	    "url" : "https://www.facebook.com/benmatthewreyes",
	    "username" : "benmatthewreyes",
	    "id" : "277702436"
	  } ]
	};

	return {
		defaultState: 'loading',

		events: {
			'app.created': 'init',

			'click .update_twitter_btn': 'update_twitter_handle'
		},

		requests: {
			get_user_identities: function() {
				return {
					url: '/api/v2/users/' + requester_id + '/identities.json',
					type: 'GET'
				};
			},
			fullcontact_api_call: function() {
				return {
					url: 'https://api.fullcontact.com/v2/person.json?apiKey=' + API_KEY + '&email=' + requester_email,
					type: 'GET',
					dataType: 'json',
					contentType: 'application/json'
				};
			},
			add_user_identity: function(twitter_handle) {
				return {
					url: '/api/v2/users/' + requester_id + '/identities.json',
					type: 'POST',
					data: {
						"identity": {
							"type": "twitter",
							"value": twitter_handle
						}
					}
				};
			}
		},

		init: function() {
			//requester_id = this.ticket().requester().id();
			//requester_email = this.ticket().requester().email();

			//this.has_twitter_profile();
			//this.load_info();
			
			var photo = _.filter(contact_data.photos, function(el) { return el.isPrimary; });
			var photo_url = photo[0].url;
			console.log(photo);
			console.log(photo_url);
			
		},

		has_twitter_profile: function() {
			var request = this.ajax('get_user_identities', requester_id).done(function(data) {
				has_twitter_profile = _.pluck(data.identities, "type").contains("twitter");
			});
		},

		load_info: function() {
			if (requester_email == null) {
				this.switchTo('not_found');
			} else {
				var request = this.ajax('fullcontact_api_call', requester_email);
				request.done(this.render_info);
				request.fail(this.render_error_page);
			}
		},

		render_info: function(data) {
			
			if (data) {
				var social_media = data.socialProfiles;
				social_media = _.reject(social_media, function(el) {
					return el.typeId === "twitter";
				});
				
				this.switchTo('user_info', {
					full_name: data.contactInfo.fullName,
					twitter_username: 'teste',
					occupations: data.organizations,
					image_url: data.photos[0].url,
					social_media: social_media,
					api_key: API_KEY,
					has_twitter_profile: has_twitter_profile
				});
			} else {
				this.render_error_page();
			}
		},

		render_error_page: function() {
			this.switchTo('error');
		},

		update_twitter_handle: function() {
			var $twitter_handle = this.$("#twitter_handle").val();

			var request = this.ajax('add_user_identity', $twitter_handle);

			request.done(function() {
				services.notify(this.I18n.t('user.updated'));
				this.$('.update_twitter_btn').hide();
			});

			request.fail(function(data) {
				var error_message = data.responseJSON.details.value[0].description;
				services.notify(error_message, 'error');
			});
		}
	};

}());

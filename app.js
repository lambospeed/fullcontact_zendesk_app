(function() {

	var requester_id;
	var requester_email;
	var has_twitter_profile;
	var API_KEY = this.setting('your_api_key');

	return {
		defaultState: 'loading',

		events: {
			'app.activated': 'init',

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
			requester_id = this.ticket().requester().id();
			requester_email = this.ticket().requester().email();

			this.has_twitter_profile();
			this.load_info();			
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
					return el.typeId === "twitter" || el.typeId === "facebook";
				});
				
				this.switchTo('user_info', {
					full_name: data.contactInfo.fullName,
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

(function() {

	var API_KEY;
	var requester_id;
	var requester_email;
	
	var can_update_twitter;
	var can_update_facebook;

	return {
		defaultState: 'loading',

		events: {
			'app.activated': 'init',
			
			'click .update_profile_twitter_btn': 'update_profile_with_twitter',
			'click .update_profile_facebook_btn': 'update_profile_with_facebook'
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
			add_twitter_identity: function(twitter_handle) {
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
			},
			add_facebook_identity: function(facebook_id) {
				return {
					url: '/api/v2/users/' + requester_id + '/identities.json',
					type: 'POST',
					data: {
						"identity": {
							"type": "facebook",
							"value": facebook_id
						}
					}
				};
			}
		},

		init: function() {
			API_KEY = this.setting('your_api_key');
			requester_id = this.ticket().requester().id();
			requester_email = this.ticket().requester().email();

			this.load_user_identities();
			this.load_info();			
		},

		load_user_identities: function() {
			var request = this.ajax('get_user_identities', requester_id).done(function(data) {
				can_update_twitter = ! _.pluck(data.identities, "type").contains("twitter");
				can_update_facebook = ! _.pluck(data.identities, "type").contains("facebook");
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
				
				var twitter_profile = _.find(social_media, function(el) { return el.typeId === "twitter"; });
				var facebook_profile = _.find(social_media, function(el) { return el.typeId === "facebook"; });
				
				social_media = _.reject(social_media, function(el) {
					return el.typeId === "twitter" || el.typeId === "facebook";
				});
				
				social_media = _.sortBy(social_media, "typeName");
				
				var primary_image = _.find(data.photos, function(el) { return el.isPrimary;	});
				
				this.switchTo('user_info', {
					full_name: data.contactInfo.fullName,
					occupations: data.organizations,
					image_url: primary_image.url,

					social_media: social_media,
					twitter_profile: twitter_profile,
					facebook_profile: facebook_profile,
					
					can_update_twitter: can_update_twitter,
					can_update_facebook: can_update_facebook,
					
					api_key: API_KEY
				});
			} else {
				this.render_error_page();
			}
		},

		render_error_page: function() {
			this.switchTo('error');
		},

		update_profile_with_twitter: function() {
			var $twitter_handle = this.$("#twitter_handle").val();

			var request = this.ajax('add_twitter_identity', $twitter_handle);

			request.done(function() {
				services.notify(this.I18n.t('user.updated'));
				this.$('.update_profile_twitter_btn').hide();
			});

			request.fail(function(data) {
				var error_message = data.responseJSON.details.value[0].description;
				services.notify(error_message, 'error');
			});
		},
		
		update_profile_with_facebook: function() {
			var $facebook_id = this.$("#facebook_id").val();

			var request = this.ajax('add_facebook_identity', $facebook_id);

			request.done(function() {
				services.notify(this.I18n.t('user.updated'));
				this.$('.update_profile_facebook_btn').hide();
			});

			request.fail(function(data) {
				var error_message = data.responseJSON.details.value[0].description;
				services.notify(error_message, 'error');
			});
		},
	};

}());

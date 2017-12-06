ModalOpener = function(){
	this.MODAL_OPENER_ID = "#modalOpener";
	this.types = {
		EDITOR: 1,
	};
	this.defaultSettings = {
		type: this.types.EDITOR
	};
	this.openModal = function(settings){
		settings = settings || this.defaultSettings;
		switch(settings.type){
			case this.types.EDITOR:
			WILL.init(1600, 1000, settings.node.drawing);
			console.log("will initiated");
				console.log('openning editor modal');
				api = api || new ApiService();
				console.log('node is: ');
				console.log(settings.node);
				api.branchFrom(settings.node, function(response){
					console.log('got branch response:');
					console.log(response);
					var $opener = $(this.MODAL_OPENER_ID);
					$opener.click();
				})
				break;
			default:
				console.log('Problem! requested unknown modal type');
				break;
		}

	}



}
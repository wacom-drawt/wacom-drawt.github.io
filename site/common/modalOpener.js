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
				console.log('openning editor modal');
				break;
			default:
				console.log('Problem! requested unknown modal type');
				break;
		}
		var $opener = $(this.MODAL_OPENER_ID);
		$opener.click();
	}



}
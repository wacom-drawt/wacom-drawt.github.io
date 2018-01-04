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
		var size = Math.min(window.innerWidth, window.innerHeight)*0.9;
		WILL.init(size, size, settings.node.drawing);
		console.log("will initiated");
		switch(settings.type){
			case this.types.EDITOR:
				console.log('openning editor modal');
				api = api || new ApiService();
				console.log('node is: ');
				console.log(settings.node);
				api.branchFrom(settings.node, function(response){
					console.log('got branch response:');
					console.log(response);
					window.newNodesParent = settings.node;
					window.newNodeId = response;
					var $opener = $("#modalOpener");
					$opener.click();
				})
				$("#modal-content").css('width', size + 'px');
				$("#modal-content").css('height', size + 'px');
				break;
			default:
				console.log('Problem! requested unknown modal type');
				break;
		}

	}

	

}
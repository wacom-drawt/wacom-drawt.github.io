ModalOpener = function(){
	this.MODAL_OPENER_ID = "#modalOpener";
	this.types = {
		EDITOR: 1,
	};
	this.openModal = function (settings) {
		$('#loaderContainer').fadeOut();
		$('#editor').fadeIn();
		var $opener = $("#modalOpener");
		$opener.click();
		var size = Math.min(window.innerWidth, window.innerHeight)*0.9;
		WILL.init(size, size, settings.node.drawing, function () {
			api = api || new ApiService();
			console.log('node is: ');
			console.log(settings.node);
			api.branchFrom(settings.node, function (response) {
				console.log('got branch response:');
				console.log(response);
				window.newNodesParent = settings.node;
				window.newNodeId = response;
			});
		});
		console.log("will initiated");
		console.log('opening editor modal');
	}

	

}
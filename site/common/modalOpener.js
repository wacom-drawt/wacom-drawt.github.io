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
		WILL.init(size, size, settings.node.drawing);
		window.newNodesParent = settings.node;
		console.log("will initiated");
		console.log('opening editor modal');
	}

	

}
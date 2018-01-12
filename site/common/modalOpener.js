ModalOpener = function () {
	this.MODAL_OPENER_ID = "#modalOpener";
	this.types = {
		EDITOR: 1,
	};
	this.openModal = function (settings) {
		$('#loaderContainer').fadeOut();
		$('#editor').fadeIn();
		this.toggleModalElement()
		var size = Math.min(window.innerWidth, window.innerHeight) * 0.9;
		WILL.init(size, size, settings.node.drawing);
		window.newNodesParent = settings.node;
		if (drawt && drawt.isDebug) {
			console.log("will initiated");
			console.log('opening editor modal');
		}
	}

	this.toggleModalElement = function () {
		var $opener = $("#modalOpener");
		$opener.click();
	}
}
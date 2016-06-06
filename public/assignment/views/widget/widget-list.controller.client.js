(function () {
    angular
        .module("WebAppMaker")
        .controller("WidgetListController", WidgetListController);

    function WidgetListController($sce, $routeParams, WidgetService) {
        var cModel = this;
        cModel.pageId = $routeParams.pid;
        cModel.userId = $routeParams.uid;
        cModel.websiteId = $routeParams.wid;
        cModel.getSafeHtml = getSafeHtml;
        cModel.getSafeUrl = getSafeUrl;

        function init() {
            WidgetService
                .findWidgetsByPageId(cModel.pageId)
                .then(function (response) {
                    cModel.widgets = response.data;
                })
            $(".widget-list-parent").sortable({
                axis: "y"
            });
        }

        init();

        function getSafeHtml(widget) {
            return $sce.trustAsHtml(widget.text);
        }

        function getSafeUrl(widget) {
            var urlParts = widget.url.split("/");
            var id = urlParts[urlParts.length - 1];
            var url = "https://www.youtube.com/embed/" + id;
            return $sce.trustAsResourceUrl(url);

        }


    }
})();

console.log("WOWWWWWWWW");


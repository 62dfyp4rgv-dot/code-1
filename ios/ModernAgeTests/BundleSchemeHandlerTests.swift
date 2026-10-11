import XCTest
@testable import ModernAge

final class BundleSchemeHandlerTests: XCTestCase {
    func testIndexResolves() {
        XCTAssertNotNil(BundleSchemeHandler.resolve(path: "/"))
        XCTAssertNotNil(BundleSchemeHandler.resolve(path: "/index.html"))
    }
    func testGameDataIsBundled() {
        for f in ["/data/countries.csv", "/data/map.json", "/data/techs.psv", "/data/events.json", "/js/main.js", "/css/app.css"] {
            XCTAssertNotNil(BundleSchemeHandler.resolve(path: f), "\(f) must be in the bundle")
        }
    }
    func testPathTraversalIsRejected() {
        XCTAssertNil(BundleSchemeHandler.resolve(path: "/../Info.plist"))
        XCTAssertNil(BundleSchemeHandler.resolve(path: "/%2e%2e/Info.plist"))
    }
    func testMimeTypes() {
        XCTAssertEqual(BundleSchemeHandler.mime["js"], "text/javascript; charset=utf-8")
        XCTAssertEqual(BundleSchemeHandler.mime["json"], "application/json")
    }
}

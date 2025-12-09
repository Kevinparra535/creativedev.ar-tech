#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(RoomPlanModule, RCTEventEmitter)

// Métodos que pueden ser llamados desde JavaScript
RCT_EXTERN_METHOD(startScanning)
RCT_EXTERN_METHOD(stopScanning)
RCT_EXTERN_METHOD(exportScan:(RCTResponseSenderBlock)callback)

@end

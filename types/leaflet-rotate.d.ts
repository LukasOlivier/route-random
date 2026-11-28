import "leaflet";

declare module "leaflet" {
  interface MapOptions {
    rotate?: boolean;
    touchRotate?: boolean;
    rotateControl?: boolean;
  }
}

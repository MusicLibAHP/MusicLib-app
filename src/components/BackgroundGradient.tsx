import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ShaderGradientAny = ShaderGradient as any;

export default function GradientBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <ShaderGradientCanvas style={{ width: "100%", height: "100%" }}>
        <ShaderGradientAny
          animate="on"
          axesHelper="on"
          bgColor1="#000000"
          bgColor2="#000000"
          brightness={1.2}
          cAzimuthAngle={180}
          cDistance={1.7}
          cPolarAngle={95}
          cameraZoom={1}
          color1="#00003e"
          color2="#0469c7"
          color3="#0b7876"
          destination="onCanvas"
          embedMode="off"
          envPreset="city"
          format="gif"
          fov={45}
          frameRate={10}
          gizmoHelper="hide"
          grain="on"
          lightType="3d"
          pixelDensity={1}
          positionX={0}
          positionY={-2.1}
          positionZ={0}
          range="disabled"
          rangeEnd={40}
          rangeStart={0}
          reflection={0.1}
          rotationX={0}
          rotationY={0}
          rotationZ={225}
          shader="defaults"
          type="waterPlane"
          uAmplitude={0}
          uDensity={1.8}
          uFrequency={5.5}
          uSpeed={0.1}
          uStrength={3}
          uTime={0.2}
          wireframe={false}
        />
      </ShaderGradientCanvas>
    </div>
  );
}

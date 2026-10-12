import { PageTitle } from "@/components/admin/bits";
import { SettingsForm } from "@/components/admin/settings-form";
import { getSettings } from "@/lib/data";

export const metadata = { title: "Тохиргоо" };

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <>
      <PageTitle title="Тохиргоо" sub="Утас, хүргэлтийн үнэ, төлбөрийн нэрс — дэлгүүрт шууд үйлчилнэ" />
      <SettingsForm settings={settings} />
    </>
  );
}

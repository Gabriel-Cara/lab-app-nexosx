import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PackagePlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useAuth } from "../hooks/useAuth";
import api from "../lib/api";
import { Package as PackageType, Resident } from "../types";

const packageSchema = z.object({
  residentId: z.string().min(1, { message: "Selecione um morador" }),
  description: z.string().min(3, { message: "Descreva o pacote" }),
  carrier: z.string().optional(),
});

type PackageForm = z.infer<typeof packageSchema>;

export const PackagesPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [codes, setCodes] = useState<Record<string, string>>({});

  const { data: packages, isLoading } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => (await api.get<PackageType[]>("/packages")).data,
  });

  const { data: residents } = useQuery({
    queryKey: ["residents"],
    queryFn: async () => (await api.get<Resident[]>("/auth/users")).data.filter((resident) => resident.role === "MORADOR"),
    enabled: user?.role !== "MORADOR",
  });

  const createMutation = useMutation({
    mutationFn: async (payload: PackageForm) => (await api.post("/packages", payload)).data,
    onSuccess: () => {
      toast.success("Encomenda cadastrada e aviso enviado ao morador");
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      createForm.reset();
    },
    onError: () => toast.error("Falha ao registrar encomenda"),
  });

  const retrieveMutation = useMutation({
    mutationFn: async ({ packageId, code }: { packageId: string; code: string }) =>
      (await api.post(`/packages/${packageId}/retrieve`, { code })).data,
    onSuccess: (_, variables) => {
      toast.success("Encomenda liberada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      setCodes((prev) => ({ ...prev, [variables.packageId]: "" }));
    },
    onError: () => toast.error("Código inválido ou erro ao liberar encomenda"),
  });

  const createForm = useForm<PackageForm>({ resolver: zodResolver(packageSchema) });

  const handleRetrieve = (packageId: string) => {
    const code = codes[packageId];
    if (!code) {
      toast.error("Informe o código entregue ao morador");
      return;
    }
    retrieveMutation.mutate({ packageId, code });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Gestão de encomendas</h2>
          <p className="text-sm text-muted-foreground">
            Controle de recebimento, notificação e retirada de pacotes.
          </p>
        </div>
      </div>

      {user?.role !== "MORADOR" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PackagePlus className="h-5 w-5" /> Nova encomenda
            </CardTitle>
            <CardDescription>Informe o morador para disparar o código automático via WhatsApp/SMS.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-3" onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))}>
              <div className="md:col-span-1">
                <Label htmlFor="residentId">Morador</Label>
                <select
                  id="residentId"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...createForm.register("residentId")}
                >
                  <option value="">Selecione</option>
                  {residents?.map((resident) => (
                    <option key={resident.id} value={resident.id}>
                      {resident.name} • {resident.apartment ?? "Sem apto"}
                    </option>
                  ))}
                </select>
                {createForm.formState.errors.residentId && (
                  <p className="text-sm text-destructive">{createForm.formState.errors.residentId.message}</p>
                )}
              </div>
              <div className="md:col-span-1">
                <Label htmlFor="description">Descrição</Label>
                <Input id="description" placeholder="Ex: Caixa grande" {...createForm.register("description")} />
                {createForm.formState.errors.description && (
                  <p className="text-sm text-destructive">{createForm.formState.errors.description.message}</p>
                )}
              </div>
              <div className="md:col-span-1">
                <Label htmlFor="carrier">Transportadora</Label>
                <Input id="carrier" placeholder="Ex: Correios" {...createForm.register("carrier")} />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Registrando..." : "Registrar encomenda"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Histórico de encomendas</CardTitle>
          <CardDescription>Visualize o status de todas as entregas registradas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Morador</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Recebida em</TableHead>
                  <TableHead>Status</TableHead>
                  {user?.role !== "MORADOR" && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages?.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell>
                      <Badge variant="outline">{pkg.code}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{pkg.resident.name}</span>
                        <span className="text-xs text-muted-foreground">{pkg.resident.apartment ?? "--"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{pkg.description}</TableCell>
                    <TableCell>
                      {format(new Date(pkg.receivedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {pkg.retrievedAt ? (
                        <Badge variant="secondary">Retirada em {format(new Date(pkg.retrievedAt), "dd/MM HH:mm", { locale: ptBR })}</Badge>
                      ) : (
                        <Badge>Pendente</Badge>
                      )}
                    </TableCell>
                    {user?.role !== "MORADOR" && (
                      <TableCell className="text-right">
                        {pkg.retrievedAt ? (
                          <span className="text-xs text-muted-foreground">Entregue</span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <Input
                              placeholder="Código"
                              className="h-9 max-w-[140px]"
                              value={codes[pkg.id] ?? ""}
                              onChange={(event) =>
                                setCodes((prev) => ({ ...prev, [pkg.id]: event.target.value.toUpperCase() }))
                              }
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={retrieveMutation.isPending}
                              onClick={() => handleRetrieve(pkg.id)}
                            >
                              Validar
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {!isLoading && packages?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={user?.role !== "MORADOR" ? 6 : 5} className="text-center text-muted-foreground">
                      Nenhuma encomenda registrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
